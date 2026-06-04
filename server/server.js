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
  title: split.title,
  amount: split.amount,
  status: split.status,
  method: split.method || "equal",
  payer: split.payer || "me",
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
  if (split.next_due_date >= today) {
    return split;
  }

  const nextDueDate = getNextDueDate(split.next_due_date, split.frequency);
  await runDb("UPDATE splits SET status = 'pending', next_due_date = ? WHERE id = ?", [nextDueDate, split.id]);
  await runDb("UPDATE split_participants SET status = CASE WHEN user_id = ? THEN 'paid' ELSE 'pending' END WHERE split_id = ?", [
    split.user_id,
    split.id,
  ]);

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
  const pendingParticipants = participants.filter((participant) => participant.status !== "paid");
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
    (participant) => participant.status !== "paid" && participant.userId && Number(participant.userId) !== Number(ownerId)
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
    addColumnIfMissing("splits", columns, "is_recurring", "INTEGER DEFAULT 0");
    addColumnIfMissing("splits", columns, "frequency", "TEXT");
    addColumnIfMissing("splits", columns, "next_due_date", "TEXT");
    addColumnIfMissing("splits", columns, "participants_json", "TEXT DEFAULT '[]'");
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

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  db.run(
    "INSERT INTO users(name, email, password) VALUES (?, ?, ?)",
    [name.trim(), email.trim().toLowerCase(), hashPassword(password)],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(409).json({ message: "An account with this email already exists" });
        }

        return res.status(500).json({ message: "Could not create account" });
      }

      res.status(201).json({
        id: this.lastID,
        name: name.trim(),
        email: email.trim().toLowerCase(),
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
    "SELECT id, name, email, password FROM users WHERE email = ?",
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

app.get("/notifications", (req, res) => {
  const userId = Number(req.query.userId);

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  db.all(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY is_read ASC, datetime(created_at) DESC, id DESC",
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
    "SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0",
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
      SELECT DISTINCT splits.*
      FROM splits
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
      SELECT DISTINCT splits.*
      FROM splits
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
  const { title, amount, status, userId, method, payer, participants, isRecurring, frequency, nextDueDate } = req.body;
  const splitStatus = status || "pending";

  if (!userId || !title || !amount) {
    return res.status(400).json({ message: "userId, title, and amount are required" });
  }

  db.run(
    "INSERT INTO splits(user_id, title, amount, status, method, payer, is_recurring, frequency, next_due_date, participants_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      userId,
      title,
      amount,
      splitStatus,
      method || "equal",
      payer || "me",
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
      const storedParticipants = Array.isArray(participants) ? participants : [];

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

        await createBalanceNotifications({
          userId,
          splitId,
          splitTitle: title,
          participants: storedParticipants,
          ownerId: userId,
        });
      } catch (notificationErr) {
        console.error("Error storing split participants/reminders:", notificationErr);
      }

      res.json({
        id: splitId,
        user_id: userId,
        title,
        amount,
        status: splitStatus,
        method: method || "equal",
        payer: payer || "me",
        is_recurring: Boolean(isRecurring),
        frequency: isRecurring ? frequency || "monthly" : null,
        next_due_date: isRecurring ? nextDueDate || formatDateOnly(new Date()) : null,
        participants: storedParticipants,
      });
    }
  );
});

app.post("/splits/:id/reminders", (req, res) => {
  const splitId = Number(req.params.id);
  const { userId, message, tone } = req.body;

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

    getSplitParticipants(split, async (participantsErr, participants) => {
      if (participantsErr) {
        return res.status(500).json({ message: "Could not load participants" });
      }

      try {
        const count = await createReminderMessageNotifications({
          splitId,
          splitTitle: split.title,
          participants,
          ownerId: split.user_id,
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
        split_participants.amount AS paid_participant_amount
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

      db.run(
        "UPDATE split_participants SET status = 'paid' WHERE split_id = ? AND user_id = ?",
        [splitId, userId],
        function (updateErr) {
          if (updateErr) {
            return res.status(500).json({ message: "Could not mark paid" });
          }

          db.run("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND split_id = ? AND type IN (?, ?)", [
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
                    userId: split.user_id,
                    splitId,
                    splitTitle: split.title,
                    amount: split.paid_participant_amount || split.amount,
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

                      res.json(formatSplitWithParticipants(updatedSplit, participants));
                    });
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

app.delete("/splits/:id", (req, res) => {
  const splitId = Number(req.params.id);
  const userId = Number(req.query.userId);

  if (!splitId || !userId) {
    return res.status(400).json({ message: "split id and userId are required" });
  }

  db.run("DELETE FROM splits WHERE id = ? AND user_id = ?", [splitId, userId], function (err) {
    if (err) {
      return res.status(500).json({ message: "Could not delete split" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: "Split not found" });
    }

    db.run("DELETE FROM notifications WHERE user_id = ? AND split_id = ?", [userId, splitId]);
    db.run("DELETE FROM split_participants WHERE split_id = ?", [splitId]);

    res.json({ id: splitId });
  });
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
