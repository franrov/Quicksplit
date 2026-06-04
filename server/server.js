import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 3001;
const databasePath = process.env.DATABASE_PATH || join(__dirname, "quicksplit.db");
const databaseDir = dirname(databasePath);

app.use(cors());
app.use(express.json());

if (!existsSync(databaseDir)) {
  mkdirSync(databaseDir, { recursive: true });
}

app.use((req, _res, next) => {
  if (req.url.startsWith("/api/")) {
    req.url = req.url.slice(4);
  }

  next();
});

const db = new sqlite3.Database(databasePath);
const PASSWORD_HASH_PREFIX = "scrypt";

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `${PASSWORD_HASH_PREFIX}:${salt}:${hash}`;
};

const verifyPassword = (password, storedPassword) => {
  const [prefix, salt, storedHash] = String(storedPassword).split(":");

  if (prefix !== PASSWORD_HASH_PREFIX || !salt || !storedHash) {
    return false;
  }

  const hash = scryptSync(password, salt, 64);
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  return storedHashBuffer.length === hash.length && timingSafeEqual(storedHashBuffer, hash);
};

const isLegacyPlainPassword = (storedPassword) => !String(storedPassword).startsWith(`${PASSWORD_HASH_PREFIX}:`);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));

const addColumnIfMissing = (tableName, columns, columnName, definition) => {
  const hasColumn = columns.some((column) => column.name === columnName);
  if (!hasColumn) {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
};

const parseParticipants = (split) => {
  if (!split?.participants_json) return [];

  try {
    return JSON.parse(split.participants_json);
  } catch {
    return [];
  }
};

const formatSplit = (split) => ({
  id: split.id,
  user_id: split.user_id,
  creator_name: split.creator_name || null,
  title: split.title,
  amount: split.amount,
  status: split.status,
  method: split.method || "equal",
  payer: split.payer || "me",
  payer_user_id: split.payer_user_id || split.user_id,
  payer_name: split.payer_name || split.creator_name || null,
  is_recurring: Boolean(split.is_recurring),
  frequency: split.frequency || null,
  next_due_date: split.next_due_date || null,
  participants: parseParticipants(split),
});

const formatSplitWithParticipants = (split, participants) => ({
  ...formatSplit(split),
  participants: participants.length > 0 ? participants : parseParticipants(split),
});

const getSplitParticipants = (split, callback) => {
  db.all(
    "SELECT * FROM split_participants WHERE split_id = ? ORDER BY id ASC",
    [split.id],
    (err, rows) => {
      if (err) {
        callback(err);
        return;
      }

      callback(
        null,
        rows.map((row) => ({
          id: row.participant_key,
          userId: row.user_id,
          name: row.name,
          amount: row.amount,
          status: row.status,
        }))
      );
    }
  );
};

const getSplitParticipantsAsync = (split) =>
  new Promise((resolve, reject) => {
    getSplitParticipants(split, (err, participants) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(participants);
    });
  });

const addDays = (date, days) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const addMonths = (date, months) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
};

const formatDateOnly = (date) => date.toISOString().slice(0, 10);

const getNextDueDate = (dateText, frequency) => {
  const date = dateText ? new Date(`${dateText}T00:00:00`) : new Date();

  if (Number.isNaN(date.getTime())) {
    return formatDateOnly(new Date());
  }

  if (frequency === "weekly") return formatDateOnly(addDays(date, 7));
  if (frequency === "bi-weekly") return formatDateOnly(addDays(date, 14));
  return formatDateOnly(addMonths(date, 1));
};

const maybeAdvanceRecurringSplit = async (split) => {
  if (!split.is_recurring || split.status !== "settled" || !split.next_due_date) {
    return split;
  }

  const today = formatDateOnly(new Date());
  if (split.next_due_date > today) {
    return split;
  }

  const nextDueDate = getNextDueDate(split.next_due_date, split.frequency);
  await runDb("UPDATE splits SET status = 'pending', next_due_date = ? WHERE id = ?", [nextDueDate, split.id]);
  await runDb("UPDATE split_participants SET status = CASE WHEN user_id = ? THEN 'paid' ELSE 'pending' END WHERE split_id = ?", [
    split.user_id,
    split.id,
  ]);
  await runDb("DELETE FROM notifications WHERE split_id = ? AND type IN (?, ?)", [split.id, "balance", "reminder"]);

  const participants = await getSplitParticipantsAsync(split);
  const nextParticipants = participants.map((participant) => ({
    ...participant,
    status: Number(participant.userId) === Number(split.user_id) ? "paid" : "pending",
  }));

  await createBalanceNotifications({
    userId: split.user_id,
    splitId: split.id,
    splitTitle: split.title,
    participants: nextParticipants,
    ownerId: split.user_id,
  });

  return {
    ...split,
    status: "pending",
    next_due_date: nextDueDate,
  };
};

const sendJsonSplits = (res, rows) => {
  const splits = [];
  let pending = rows.length;

  if (pending === 0) {
    res.json([]);
    return;
  }

  rows.forEach(async (split) => {
    const currentSplit = await maybeAdvanceRecurringSplit(split);

    getSplitParticipants(currentSplit, (err, participants) => {
      if (err) {
        if (!res.headersSent) {
          res.status(500).json({ message: "Could not load split participants" });
        }
        return;
      }

      splits.push(formatSplitWithParticipants(currentSplit, participants));
      pending -= 1;

      if (pending === 0 && !res.headersSent) {
        res.json(splits.sort((a, b) => b.id - a.id));
      }
    });
  });
};

const formatNotification = (notification) => ({
  id: notification.id,
  user_id: notification.user_id,
  split_id: notification.split_id,
  type: notification.type,
  participant_id: notification.participant_id,
  participant_name: notification.participant_name,
  amount: notification.amount,
  split_title: notification.split_title,
  message: notification.message,
  tone: notification.tone,
  is_read: Boolean(notification.is_read),
  created_at: notification.created_at,
});

const runDb = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }

      resolve(this);
    });
  });

const getDb = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row);
    });
  });

const toMoney = (value) => Number((Number(value) || 0).toFixed(2));

const getWalletBalance = async (userId) => {
  const user = await getDb("SELECT wallet_balance FROM users WHERE id = ?", [userId]);
  if (!user) return null;
  return toMoney(user.wallet_balance ?? 1000);
};

const depositWallet = async (userId, amount) => {
  const depositAmount = toMoney(amount);

  if (!depositAmount || depositAmount <= 0) {
    const error = new Error("Deposit amount must be greater than zero");
    error.statusCode = 400;
    throw error;
  }

  const balance = await getWalletBalance(userId);
  if (balance === null) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const nextBalance = toMoney(balance + depositAmount);
  await runDb("UPDATE users SET wallet_balance = ? WHERE id = ?", [nextBalance, userId]);
  return nextBalance;
};

const deductWallet = async (userId, amount) => {
  const chargeAmount = toMoney(amount);

  if (!chargeAmount || chargeAmount <= 0) {
    return getWalletBalance(userId);
  }

  const balance = await getWalletBalance(userId);
  if (balance === null) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (balance < chargeAmount) {
    const error = new Error("Insufficient funds. Deposit money before paying this split.");
    error.statusCode = 402;
    error.walletBalance = balance;
    throw error;
  }

  const nextBalance = toMoney(balance - chargeAmount);
  await runDb("UPDATE users SET wallet_balance = ? WHERE id = ?", [nextBalance, userId]);
  return nextBalance;
};

const upsertBalanceNotification = ({ userId, splitId, participant, splitTitle }) => {
  return getDb(
    "SELECT id FROM notifications WHERE user_id = ? AND split_id = ? AND type = ? AND participant_id = ?",
    [userId, splitId, "balance", participant.id]
  ).then((existing) => {
    if (existing) {
      return runDb(
        "UPDATE notifications SET is_read = 0, amount = ?, participant_name = ?, split_title = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?",
        [participant.amount, participant.name, splitTitle, existing.id]
      ).then(() => true);
    }

    return runDb(
      "INSERT INTO notifications(user_id, split_id, type, participant_id, participant_name, amount, split_title) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, splitId, "balance", participant.id, participant.name, participant.amount, splitTitle]
    ).then(() => true);
  });
};

const createBalanceNotifications = async ({ userId, splitId, splitTitle, participants, ownerId = userId }) => {
  const pendingParticipants = participants.filter((participant) => participant.status === "pending");
  const writes = [];

  pendingParticipants.forEach((participant) => {
    if (participant.userId && Number(participant.userId) !== Number(ownerId)) {
      writes.push(upsertBalanceNotification({
        userId: participant.userId,
        splitId,
        participant: { ...participant, id: "me", name: "You" },
        splitTitle,
      }));
    }

    if (Number(userId) === Number(ownerId) && participant.id !== "me") {
      writes.push(upsertBalanceNotification({ userId, splitId, participant, splitTitle }));
    }
  });

  const results = await Promise.all(writes);
  return results.filter(Boolean).length;
};

const createReminderMessageNotifications = async ({ splitId, splitTitle, participants, ownerId, message, tone }) => {
  const pendingParticipants = participants.filter(
    (participant) => participant.status === "pending" && participant.userId && Number(participant.userId) !== Number(ownerId)
  );

  await Promise.all(
    pendingParticipants.map((participant) =>
      runDb(
        "INSERT INTO notifications(user_id, split_id, type, participant_id, participant_name, amount, split_title, message, tone, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)",
        [
          participant.userId,
          splitId,
          "reminder",
          "me",
          participant.name,
          participant.amount,
          splitTitle,
          message,
          tone,
        ]
      )
    )
  );

  return pendingParticipants.length;
};

const createInviteNotifications = async ({ splitId, splitTitle, participants, ownerId }) => {
  const invitedParticipants = participants.filter(
    (participant) => participant.status === "invited" && participant.userId && Number(participant.userId) !== Number(ownerId)
  );

  await Promise.all(
    invitedParticipants.map((participant) =>
      runDb(
        "INSERT INTO notifications(user_id, split_id, type, participant_id, participant_name, amount, split_title, message, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)",
        [
          participant.userId,
          splitId,
          "invite",
          participant.id,
          participant.name,
          participant.amount,
          splitTitle,
          "You were invited to join this split.",
        ]
      )
    )
  );

  return invitedParticipants.length;
};

const createPayerInviteNotification = ({ userId, splitId, splitTitle, amount, payerName }) => {
  return runDb(
    "INSERT INTO notifications(user_id, split_id, type, participant_id, participant_name, amount, split_title, message, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)",
    [
      userId,
      splitId,
      "payer_invite",
      "payer",
      payerName,
      amount,
      splitTitle,
      "You were selected to pay this split upfront.",
    ]
  );
};

const createPaidNotification = ({ userId, splitId, splitTitle, amount, participantName = "Split" }) => {
  db.run(
    "INSERT INTO notifications(user_id, split_id, type, participant_id, participant_name, amount, split_title, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
    [userId, splitId, "paid", "split", participantName, amount, splitTitle]
  );
};

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      wallet_balance REAL DEFAULT 1000,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      method TEXT DEFAULT 'equal',
      payer TEXT DEFAULT 'me',
      payer_user_id INTEGER,
      payer_name TEXT,
      is_recurring INTEGER DEFAULT 0,
      frequency TEXT,
      next_due_date TEXT,
      participants_json TEXT DEFAULT '[]',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      split_id INTEGER,
      type TEXT NOT NULL,
      participant_id TEXT,
      participant_name TEXT,
      amount REAL,
      split_title TEXT,
      message TEXT,
      tone TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (split_id) REFERENCES splits(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS split_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      split_id INTEGER NOT NULL,
      user_id INTEGER,
      participant_key TEXT NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (split_id) REFERENCES splits(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.all("PRAGMA table_info(splits)", [], (err, columns) => {
    if (err) {
      console.error("Error checking splits table:", err);
      return;
    }

    addColumnIfMissing("splits", columns, "user_id", "INTEGER");
    addColumnIfMissing("splits", columns, "method", "TEXT DEFAULT 'equal'");
    addColumnIfMissing("splits", columns, "payer", "TEXT DEFAULT 'me'");
    addColumnIfMissing("splits", columns, "payer_user_id", "INTEGER");
    addColumnIfMissing("splits", columns, "payer_name", "TEXT");
    addColumnIfMissing("splits", columns, "is_recurring", "INTEGER DEFAULT 0");
    addColumnIfMissing("splits", columns, "frequency", "TEXT");
    addColumnIfMissing("splits", columns, "next_due_date", "TEXT");
    addColumnIfMissing("splits", columns, "participants_json", "TEXT DEFAULT '[]'");
  });

  db.all("PRAGMA table_info(users)", [], (err, columns) => {
    if (err) {
      console.error("Error checking users table:", err);
      return;
    }

    const hasWalletBalance = columns.some((column) => column.name === "wallet_balance");

    if (hasWalletBalance) {
      db.run("UPDATE users SET wallet_balance = 1000 WHERE wallet_balance IS NULL");
      return;
    }

    db.run("ALTER TABLE users ADD COLUMN wallet_balance REAL DEFAULT 1000", [], (walletErr) => {
      if (walletErr) {
        console.error("Error adding users.wallet_balance column:", walletErr);
        return;
      }

      db.run("UPDATE users SET wallet_balance = 1000 WHERE wallet_balance IS NULL");
    });
  });

  db.all("PRAGMA table_info(notifications)", [], (err, columns) => {
    if (err) {
      console.error("Error checking notifications table:", err);
      return;
    }

    const hasMessage = columns.some((column) => column.name === "message");
    const hasTone = columns.some((column) => column.name === "tone");

    const migrateOldReminderRows = () => {
      db.run(
        "UPDATE notifications SET type = 'balance' WHERE type = 'reminder' AND (message IS NULL OR message = '')",
        [],
        (updateErr) => {
          if (updateErr) {
            console.error("Error migrating old reminder notifications:", updateErr);
          }
        }
      );
    };

    const ensureToneColumn = () => {
      if (hasTone) {
        migrateOldReminderRows();
        return;
      }

      db.run("ALTER TABLE notifications ADD COLUMN tone TEXT", [], (toneErr) => {
        if (toneErr) {
          console.error("Error adding notifications.tone column:", toneErr);
          return;
        }

        migrateOldReminderRows();
      });
    };

    if (hasMessage) {
      ensureToneColumn();
      return;
    }

    db.run("ALTER TABLE notifications ADD COLUMN message TEXT", [], (messageErr) => {
      if (messageErr) {
        console.error("Error adding notifications.message column:", messageErr);
        return;
      }

      ensureToneColumn();
    });
  });
});

app.post("/auth/signup", (req, res) => {
  const { name, email, password } = req.body;
  const trimmedName = String(name || "").trim();
  const trimmedEmail = String(email || "").trim().toLowerCase();
  const errors = {};

  if (!trimmedName) {
    errors.name = "The Name field is required";
  }

  if (!trimmedEmail) {
    errors.email = "The Email field is required";
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = "Enter a valid email address";
  }

  if (!password) {
    errors.password = "The Password field is required";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: "Please fix the signup form errors", errors });
  }

  db.run(
    "INSERT INTO users(name, email, password, wallet_balance) VALUES (?, ?, ?, ?)",
    [trimmedName, trimmedEmail, hashPassword(password), 1000],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(409).json({ message: "An account with this email already exists" });
        }

        return res.status(500).json({ message: "Could not create account" });
      }

      res.status(201).json({
        id: this.lastID,
        name: trimmedName,
        email: trimmedEmail,
        wallet_balance: 1000,
      });
    }
  );
});

app.post("/auth/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  db.get(
    "SELECT id, name, email, password, wallet_balance FROM users WHERE email = ?",
    [email.trim().toLowerCase()],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: "Could not log in" });
      }

      if (!user) {
        return res.status(401).json({ message: "No account found with those login details" });
      }

      const passwordMatches = isLegacyPlainPassword(user.password)
        ? user.password === password
        : verifyPassword(password, user.password);

      if (!passwordMatches) {
        return res.status(401).json({ message: "No account found with those login details" });
      }

      if (isLegacyPlainPassword(user.password)) {
        db.run("UPDATE users SET password = ? WHERE id = ?", [hashPassword(password), user.id]);
      }

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        wallet_balance: toMoney(user.wallet_balance ?? 1000),
      });
    }
  );
});

app.patch("/auth/change-password", (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current password and new password are required" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  db.get("SELECT id, password FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Could not change password" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatches = isLegacyPlainPassword(user.password)
      ? user.password === currentPassword
      : verifyPassword(currentPassword, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    db.run("UPDATE users SET password = ? WHERE id = ?", [hashPassword(newPassword), userId], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ message: "Could not change password" });
      }

      res.json({ message: "Password changed successfully" });
    });
  });
});

app.get("/users", (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  db.all(
    "SELECT id, name, email FROM users WHERE id != ? ORDER BY name ASC",
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Could not load users" });
      }

      res.json(rows);
    }
  );
});

app.get("/wallet", async (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  try {
    const walletBalance = await getWalletBalance(userId);

    if (walletBalance === null) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ wallet_balance: walletBalance });
  } catch (err) {
    console.error("Error loading wallet:", err);
    res.status(500).json({ message: "Could not load wallet" });
  }
});

app.post("/wallet/deposit", async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ message: "userId and amount are required" });
  }

  try {
    const walletBalance = await depositWallet(userId, amount);
    res.json({ wallet_balance: walletBalance });
  } catch (err) {
    console.error("Error depositing funds:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Could not deposit funds" });
  }
});

app.get("/notifications", (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  db.all(
    `
      SELECT notifications.*
      FROM notifications
      LEFT JOIN splits ON splits.id = notifications.split_id
      LEFT JOIN split_participants
        ON split_participants.split_id = notifications.split_id
        AND split_participants.user_id = notifications.user_id
      WHERE notifications.user_id = ?
      AND (notifications.split_id IS NULL OR splits.id IS NOT NULL)
      AND NOT (
        notifications.type IN ('balance', 'reminder')
        AND (
          COALESCE(splits.status, '') IN ('settled', 'suspended')
          OR COALESCE(split_participants.status, '') IN ('paid', 'suspended')
        )
      )
      ORDER BY notifications.is_read ASC, datetime(notifications.created_at) DESC, notifications.id DESC
    `,
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: "Could not load notifications" });
      }

      res.json(rows.map(formatNotification));
    }
  );
});

app.get("/notifications/unread-count", (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  db.get(
    `
      SELECT COUNT(*) AS count
      FROM notifications
      LEFT JOIN splits ON splits.id = notifications.split_id
      LEFT JOIN split_participants
        ON split_participants.split_id = notifications.split_id
        AND split_participants.user_id = notifications.user_id
      WHERE notifications.user_id = ?
      AND notifications.is_read = 0
      AND (notifications.split_id IS NULL OR splits.id IS NOT NULL)
      AND NOT (
        notifications.type IN ('balance', 'reminder')
        AND (
          COALESCE(splits.status, '') IN ('settled', 'suspended')
          OR COALESCE(split_participants.status, '') IN ('paid', 'suspended')
        )
      )
    `,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ message: "Could not load unread count" });
      }

      res.json({ count: row.count });
    }
  );
});

app.patch("/notifications/:id/read", (req, res) => {
  const notificationId = Number(req.params.id);
  const { userId } = req.body;

  if (!notificationId || !userId) {
    return res.status(400).json({ message: "notification id and userId are required" });
  }

  db.run(
    "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
    [notificationId, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "Could not update notification" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ id: notificationId, is_read: true });
    }
  );
});

app.delete("/notifications/:id", (req, res) => {
  const notificationId = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!notificationId || !userId) {
    return res.status(400).json({ message: "notification id and userId are required" });
  }

  db.run("DELETE FROM notifications WHERE id = ? AND user_id = ?", [notificationId, userId], function (err) {
    if (err) {
      return res.status(500).json({ message: "Could not delete notification" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ id: notificationId });
  });
});

app.patch("/notifications/read-all", (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  db.run("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [userId], function (err) {
    if (err) {
      return res.status(500).json({ message: "Could not update notifications" });
    }

    res.json({ updated: this.changes });
  });
});

app.get("/splits", (req, res) => {
  const userId = Number(req.query.userId);
  const recurring = req.query.recurring === "1" ? 1 : 0;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  db.all(
    `
      SELECT DISTINCT splits.*, users.name AS creator_name
      FROM splits
      LEFT JOIN users ON users.id = splits.user_id
      LEFT JOIN split_participants ON split_participants.split_id = splits.id
      WHERE (splits.user_id = ? OR split_participants.user_id = ?)
      AND COALESCE(splits.is_recurring, 0) = ?
      ORDER BY splits.id DESC
    `,
    [userId, userId, recurring],
    (err, rows) => {
    if (err) {
      return res.status(500).json(err);
    }

    sendJsonSplits(res, rows);
    }
  );
});

app.get("/splits/:id", (req, res) => {
  const splitId = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!splitId || !userId) {
    return res.status(400).json({ message: "split id and userId are required" });
  }

  db.get(
    `
      SELECT DISTINCT splits.*, users.name AS creator_name
      FROM splits
      LEFT JOIN users ON users.id = splits.user_id
      LEFT JOIN split_participants ON split_participants.split_id = splits.id
      WHERE splits.id = ? AND (splits.user_id = ? OR split_participants.user_id = ?)
    `,
    [splitId, userId, userId],
    (err, split) => {
    if (err) {
      return res.status(500).json({ message: "Could not load split" });
    }

    if (!split) {
      return res.status(404).json({ message: "Split not found" });
    }

    getSplitParticipants(split, (participantsErr, participants) => {
      if (participantsErr) {
        return res.status(500).json({ message: "Could not load split participants" });
      }

      res.json(formatSplitWithParticipants(split, participants));
    });
    }
  );
});

app.post("/splits", (req, res) => {
  const {
    title,
    amount,
    status,
    userId,
    method,
    payer,
    payerUserId,
    payerName,
    participants,
    isRecurring,
    frequency,
    nextDueDate,
  } = req.body;
  const splitStatus = status || "pending";
  const totalAmount = toMoney(amount);
  const selectedPayerUserId = Number(payerUserId || userId);
  const selectedPayerName = payerName || null;
  const isExternalPayer = (payer || "me") === "other" && selectedPayerUserId && selectedPayerUserId !== Number(userId);

  if (!userId || !title || !totalAmount) {
    return res.status(400).json({ message: "userId, title, and amount are required" });
  }

  Promise.resolve()
    .then(async () => {
      if ((payer || "me") === "me") {
        return deductWallet(userId, totalAmount);
      }

      return getWalletBalance(userId);
    })
    .then((walletBalance) => {
  db.run(
    "INSERT INTO splits(user_id, title, amount, status, method, payer, payer_user_id, payer_name, is_recurring, frequency, next_due_date, participants_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      userId,
      title,
      totalAmount,
      isExternalPayer ? "awaiting_payer" : splitStatus,
      method || "equal",
      payer || "me",
      selectedPayerUserId,
      selectedPayerName,
      isRecurring ? 1 : 0,
      isRecurring ? frequency || "monthly" : null,
      isRecurring ? nextDueDate || formatDateOnly(new Date()) : null,
      JSON.stringify(Array.isArray(participants) ? participants : []),
    ],
    async function (err) {
      if (err) {
        return res.status(500).json(err);
      }

      const splitId = this.lastID;
      const storedParticipants = (Array.isArray(participants) ? participants : []).map((participant) => ({
        ...participant,
        status:
          isExternalPayer && Number(participant.userId) === Number(selectedPayerUserId)
            ? "payer_invited"
            : isExternalPayer
            ? "waiting"
            : participant.userId && Number(participant.userId) !== Number(userId) && participant.status !== "paid"
            ? "invited"
            : participant.status || "pending",
      }));

      try {
        await Promise.all(storedParticipants.map((participant) =>
          runDb(
          "INSERT INTO split_participants(split_id, user_id, participant_key, name, amount, status) VALUES (?, ?, ?, ?, ?, ?)",
          [
            splitId,
            participant.userId || (participant.id === "me" ? userId : null),
            participant.id,
            participant.name,
            participant.amount,
            participant.status || "pending",
          ]
          )
        ));

        if (isExternalPayer) {
          await createPayerInviteNotification({
            userId: selectedPayerUserId,
            splitId,
            splitTitle: title,
            amount: totalAmount,
            payerName: selectedPayerName || "Selected payer",
          });
        } else {
          await createInviteNotifications({
            splitId,
            splitTitle: title,
            participants: storedParticipants,
            ownerId: userId,
          });
        }
      } catch (notificationErr) {
        console.error("Error storing split participants/reminders:", notificationErr);
      }

      res.json({
        id: splitId,
        user_id: userId,
        title,
        amount: totalAmount,
        status: isExternalPayer ? "awaiting_payer" : splitStatus,
        method: method || "equal",
        payer: payer || "me",
        payer_user_id: selectedPayerUserId,
        payer_name: selectedPayerName,
        is_recurring: Boolean(isRecurring),
        frequency: isRecurring ? frequency || "monthly" : null,
        next_due_date: isRecurring ? nextDueDate || formatDateOnly(new Date()) : null,
        participants: storedParticipants,
        wallet_balance: walletBalance,
      });
    }
  );
    })
    .catch((err) => {
      console.error("Error creating split:", err);
      res.status(err.statusCode || 500).json({
        message: err.message || "Could not create split",
        wallet_balance: err.walletBalance,
      });
    });
});

app.post("/splits/:id/respond", (req, res) => {
  const splitId = Number(req.params.id);
  const { userId, response } = req.body;

  if (!splitId || !userId || !["accepted", "rejected"].includes(response)) {
    return res.status(400).json({ message: "split id, userId, and response are required" });
  }

  db.get("SELECT * FROM splits WHERE id = ?", [splitId], (splitErr, split) => {
    if (splitErr) {
      return res.status(500).json({ message: "Could not load split" });
    }

    if (!split) {
      return res.status(404).json({ message: "Split not found" });
    }

    db.get(
      "SELECT * FROM split_participants WHERE split_id = ? AND user_id = ?",
      [splitId, userId],
      async (participantErr, participant) => {
        if (participantErr) {
          return res.status(500).json({ message: "Could not load participant" });
        }

        if (!participant || participant.status !== "invited") {
          return res.status(404).json({ message: "Invitation not found" });
        }

        try {
          const paymentOwnerId = split.payer_user_id || split.user_id;

          if (response === "accepted") {
            await runDb("UPDATE split_participants SET status = 'pending' WHERE id = ?", [participant.id]);
            await runDb("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND split_id = ? AND type = 'invite'", [
              userId,
              splitId,
            ]);

            await upsertBalanceNotification({
              userId,
              splitId,
              participant: { id: "me", name: "You", amount: participant.amount },
              splitTitle: split.title,
            });
            await upsertBalanceNotification({
              userId: paymentOwnerId,
              splitId,
              participant: {
                id: participant.participant_key,
                name: participant.name,
                amount: participant.amount,
              },
              splitTitle: split.title,
            });
          } else {
            await runDb("UPDATE split_participants SET status = 'rejected', amount = 0 WHERE id = ?", [participant.id]);
            await runDb(
              "UPDATE split_participants SET amount = amount + ? WHERE split_id = ? AND user_id = ?",
              [participant.amount, splitId, paymentOwnerId]
            );
            await runDb("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND split_id = ? AND type = 'invite'", [
              userId,
              splitId,
            ]);
          }

          db.get("SELECT * FROM splits WHERE id = ?", [splitId], (updatedErr, updatedSplit) => {
            if (updatedErr || !updatedSplit) {
              return res.status(500).json({ message: "Could not refresh split" });
            }

            getSplitParticipants(updatedSplit, (participantsErr, participants) => {
              if (participantsErr) {
                return res.status(500).json({ message: "Could not load split participants" });
              }

              const hasOpenParticipants = participants.some((item) => item.status === "pending" || item.status === "invited");
              const nextStatus = hasOpenParticipants ? "pending" : "settled";

              db.run("UPDATE splits SET status = ? WHERE id = ?", [nextStatus, splitId], () => {
                res.json({
                  ...formatSplitWithParticipants({ ...updatedSplit, status: nextStatus }, participants),
                  response,
                });
              });
            });
          });
        } catch (err) {
          console.error("Error responding to split invitation:", err);
          res.status(500).json({ message: "Could not respond to invitation" });
        }
      }
    );
  });
});

app.post("/splits/:id/payer-response", (req, res) => {
  const splitId = Number(req.params.id);
  const { userId, response } = req.body;

  if (!splitId || !userId || !["accepted", "rejected"].includes(response)) {
    return res.status(400).json({ message: "split id, userId, and response are required" });
  }

  db.get("SELECT * FROM splits WHERE id = ? AND payer_user_id = ?", [splitId, userId], async (err, split) => {
    if (err) {
      return res.status(500).json({ message: "Could not load split" });
    }

    if (!split || split.status !== "awaiting_payer") {
      return res.status(404).json({ message: "Payer approval not found" });
    }

    try {
      if (response === "rejected") {
        await runDb("DELETE FROM notifications WHERE split_id = ?", [splitId]);
        await runDb("DELETE FROM split_participants WHERE split_id = ?", [splitId]);
        await runDb("DELETE FROM splits WHERE id = ?", [splitId]);
        return res.json({ id: splitId, response, deleted: true });
      }

      const walletBalance = await deductWallet(userId, split.amount);
      await runDb("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND split_id = ? AND type = 'payer_invite'", [
        userId,
        splitId,
      ]);
      await runDb(
        "UPDATE split_participants SET status = CASE WHEN user_id = ? THEN 'paid' WHEN user_id = ? THEN 'pending' WHEN status = 'waiting' THEN 'invited' ELSE status END WHERE split_id = ?",
        [userId, split.user_id, splitId]
      );
      await runDb("UPDATE splits SET status = 'pending' WHERE id = ?", [splitId]);

      const updatedSplit = await getDb("SELECT * FROM splits WHERE id = ?", [splitId]);
      const participants = await getSplitParticipantsAsync(updatedSplit);
      await createInviteNotifications({
        splitId,
        splitTitle: split.title,
        participants,
        ownerId: userId,
      });
      await createBalanceNotifications({
        userId,
        splitId,
        splitTitle: split.title,
        participants,
        ownerId: userId,
      });

      res.json({
        ...formatSplitWithParticipants({ ...updatedSplit, status: "pending" }, participants),
        response,
        wallet_balance: walletBalance,
      });
    } catch (approvalErr) {
      console.error("Error responding to payer approval:", approvalErr);
      res.status(approvalErr.statusCode || 500).json({
        message: approvalErr.message || "Could not respond to payer approval",
        wallet_balance: approvalErr.walletBalance,
      });
    }
  });
});

app.post("/splits/:id/reminders", (req, res) => {
  const splitId = Number(req.params.id);
  const { userId, message, tone } = req.body;

  if (!splitId || !userId) {
    return res.status(400).json({ message: "split id and userId are required" });
  }

  db.get("SELECT * FROM splits WHERE id = ? AND (user_id = ? OR payer_user_id = ?)", [splitId, userId, userId], (err, split) => {
    if (err) {
      return res.status(500).json({ message: "Could not load split" });
    }

    if (!split) {
      return res.status(404).json({ message: "Split not found" });
    }

    getSplitParticipants(split, async (participantsErr, participants) => {
      if (participantsErr) {
        return res.status(500).json({ message: "Could not load participants" });
      }

      try {
        const count = await createReminderMessageNotifications({
          splitId,
          splitTitle: split.title,
          participants,
          ownerId: split.payer_user_id || split.user_id,
          message: String(message || "").trim() || "Friendly reminder to settle this split when you can.",
          tone: tone || "custom",
        });

        res.json({ count });
      } catch (notificationErr) {
        console.error("Error sending reminders:", notificationErr);
        res.status(500).json({ message: "Could not send reminders" });
      }
    });
  });
});

app.patch("/splits/:id/settle", (req, res) => {
  const splitId = Number(req.params.id);
  const { userId } = req.body;

  if (!splitId || !userId) {
    return res.status(400).json({ message: "split id and userId are required" });
  }

  db.get("SELECT * FROM splits WHERE id = ? AND user_id = ?", [splitId, userId], (err, split) => {
    if (err) {
      return res.status(500).json({ message: "Could not load split" });
    }

    if (!split) {
      return res.status(404).json({ message: "Split not found" });
    }

    getSplitParticipants(split, (participantsErr, participants) => {
      if (participantsErr) {
        return res.status(500).json({ message: "Could not load participants" });
      }

      const sourceParticipants = participants.length > 0 ? participants : parseParticipants(split);
      const settledParticipants = sourceParticipants.map((participant) => ({
        ...participant,
        status: "paid",
      }));

    db.run(
      "UPDATE splits SET status = ?, participants_json = ? WHERE id = ? AND user_id = ?",
      ["settled", JSON.stringify(settledParticipants), splitId, userId],
      function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ message: "Could not settle split" });
        }

        db.run("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND split_id = ? AND type IN (?, ?)", [
          userId,
          splitId,
          "balance",
          "reminder",
        ]);
        db.run("UPDATE split_participants SET status = 'paid' WHERE split_id = ?", [splitId]);
        createPaidNotification({
          userId,
          splitId,
          splitTitle: split.title,
          amount: split.amount,
        });

        res.json({
          ...formatSplit(split),
          status: "settled",
          participants: settledParticipants,
        });
      }
    );
    });
  });
});

app.patch("/splits/:id/pay", (req, res) => {
  const splitId = Number(req.params.id);
  const { userId } = req.body;

  if (!splitId || !userId) {
    return res.status(400).json({ message: "split id and userId are required" });
  }

  db.get(
    `
      SELECT
        splits.*,
        split_participants.name AS paid_participant_name,
        split_participants.amount AS paid_participant_amount,
        split_participants.status AS paid_participant_status
      FROM splits
      JOIN split_participants ON split_participants.split_id = splits.id
      WHERE splits.id = ? AND split_participants.user_id = ?
    `,
    [splitId, userId],
    (err, split) => {
      if (err) {
        return res.status(500).json({ message: "Could not load split" });
      }

      if (!split) {
        return res.status(404).json({ message: "Split not found" });
      }

      if (split.paid_participant_status === "paid") {
        return res.status(409).json({ message: "This payment is already marked paid" });
      }

      const paidAmount = split.paid_participant_amount || split.amount;

      Promise.resolve()
        .then(() => deductWallet(userId, paidAmount))
        .then((walletBalance) => {
      db.run(
        "UPDATE split_participants SET status = 'paid' WHERE split_id = ? AND user_id = ?",
        [splitId, userId],
        function (updateErr) {
          if (updateErr) {
            return res.status(500).json({ message: "Could not mark paid" });
          }

          const paymentOwnerId = split.payer_user_id || split.user_id;

          Promise.resolve()
            .then(() => (Number(paymentOwnerId) === Number(userId) ? walletBalance : depositWallet(paymentOwnerId, paidAmount)))
            .then((ownerWalletBalance) => {
          db.run("DELETE FROM notifications WHERE user_id = ? AND split_id = ? AND type IN (?, ?)", [
            userId,
            splitId,
            "balance",
            "reminder",
          ]);

          db.get(
            "SELECT COUNT(*) AS pending FROM split_participants WHERE split_id = ? AND status != 'paid'",
            [splitId],
            (countErr, row) => {
              if (countErr) {
                return res.status(500).json({ message: "Could not refresh split" });
              }

              const nextStatus = row.pending === 0 ? "settled" : "pending";
              db.run(
                "UPDATE splits SET status = ? WHERE id = ?",
                [nextStatus, splitId],
                () => {
                  createPaidNotification({
                    userId: paymentOwnerId,
                    splitId,
                    splitTitle: split.title,
                    amount: paidAmount,
                    participantName: split.paid_participant_name || "Someone",
                  });

                  db.get("SELECT * FROM splits WHERE id = ?", [splitId], (splitErr, updatedSplit) => {
                    if (splitErr || !updatedSplit) {
                      return res.status(500).json({ message: "Could not load updated split" });
                    }

                    getSplitParticipants(updatedSplit, (participantsErr, participants) => {
                      if (participantsErr) {
                        return res.status(500).json({ message: "Could not load participants" });
                      }

                      res.json({
                        ...formatSplitWithParticipants(updatedSplit, participants),
                        wallet_balance: walletBalance,
                        owner_wallet_balance: ownerWalletBalance,
                      });
                    });
                  });
                }
              );
            }
          );
            })
            .catch((transferErr) => {
              console.error("Error crediting split owner:", transferErr);
              res.status(transferErr.statusCode || 500).json({ message: transferErr.message || "Could not transfer payment" });
            });
        }
      );
        })
        .catch((walletErr) => {
          console.error("Error deducting wallet for payment:", walletErr);
          res.status(walletErr.statusCode || 500).json({
            message: walletErr.message || "Could not mark paid",
            wallet_balance: walletErr.walletBalance,
          });
        });
    }
  );
});

app.patch("/splits/:id/suspend", (req, res) => {
  const splitId = Number(req.params.id);
  const { userId } = req.body;

  if (!splitId || !userId) {
    return res.status(400).json({ message: "split id and userId are required" });
  }

  db.get("SELECT * FROM splits WHERE id = ? AND user_id = ?", [splitId, userId], (err, split) => {
    if (err) {
      return res.status(500).json({ message: "Could not load split" });
    }

    if (!split) {
      return res.status(404).json({ message: "Only the creator can suspend this split" });
    }

    if (split.status === "settled") {
      return res.status(409).json({ message: "Settled splits do not need to be suspended" });
    }

    db.run("UPDATE splits SET status = 'suspended' WHERE id = ? AND user_id = ?", [splitId, userId], function (updateErr) {
      if (updateErr) {
        return res.status(500).json({ message: "Could not suspend split" });
      }

      db.run("UPDATE split_participants SET status = 'suspended' WHERE split_id = ? AND status != 'paid'", [splitId]);
      db.run("UPDATE notifications SET is_read = 1 WHERE split_id = ? AND type IN (?, ?, ?)", [
        splitId,
        "balance",
        "invite",
        "reminder",
      ]);

      db.get("SELECT * FROM splits WHERE id = ?", [splitId], (splitErr, updatedSplit) => {
        if (splitErr || !updatedSplit) {
          return res.status(500).json({ message: "Could not load suspended split" });
        }

        getSplitParticipants(updatedSplit, (participantsErr, participants) => {
          if (participantsErr) {
            return res.status(500).json({ message: "Could not load participants" });
          }

          res.json(formatSplitWithParticipants(updatedSplit, participants));
        });
      });
    });
  });
});

app.delete("/splits/:id", (req, res) => {
  const splitId = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!splitId || !userId) {
    return res.status(400).json({ message: "split id and userId are required" });
  }

  db.get(
    `
      SELECT DISTINCT splits.*
      FROM splits
      LEFT JOIN split_participants ON split_participants.split_id = splits.id
      WHERE splits.id = ? AND (splits.user_id = ? OR split_participants.user_id = ?)
    `,
    [splitId, userId, userId],
    (loadErr, split) => {
      if (loadErr) {
        return res.status(500).json({ message: "Could not load split" });
      }

      if (!split) {
        return res.status(404).json({ message: "Split not found" });
      }

      const isCreator = Number(split.user_id) === Number(userId);
      const isSettled = split.status === "settled";
      const isRecurring = Boolean(split.is_recurring);

      if (isRecurring && !isCreator) {
        return res.status(403).json({ message: "Only the creator can delete a recurring split" });
      }

      if (!isCreator && !isSettled) {
        return res.status(403).json({ message: "Only the creator can delete an active split" });
      }

      db.run("DELETE FROM notifications WHERE split_id = ?", [splitId]);
      db.run("DELETE FROM split_participants WHERE split_id = ?", [splitId]);
      db.run("DELETE FROM splits WHERE id = ?", [splitId], function (err) {
    if (err) {
      return res.status(500).json({ message: "Could not delete split" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Split not found" });
    }

    res.json({ id: splitId });
  });
    }
  );
});

if (isProduction) {
  const clientPath = join(__dirname, "..", "dist");

  app.use(express.static(clientPath));
  app.use((req, res, next) => {
    if (req.method === "GET" && req.accepts("html")) {
      res.sendFile(join(clientPath, "index.html"));
      return;
    }

    next();
  });
}

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`Using database at ${databasePath}`);
});
