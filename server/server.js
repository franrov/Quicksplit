import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(join(__dirname, "quicksplit.db"));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending'
    )
  `);
});

app.get("/splits", (req, res) => {
  db.all("SELECT * FROM splits", [], (err, rows) => {
    if (err) {
      return res.status(500).json(err);
    }

    res.json(rows);
  });
});

app.post("/splits", (req, res) => {
  const { title, amount, status } = req.body;
  const splitStatus = status || "pending";

  db.run(
    "INSERT INTO splits(title, amount, status) VALUES (?, ?, ?)",
    [title, amount, splitStatus],
    function (err) {
      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        id: this.lastID,
        title,
        amount,
        status: splitStatus,
      });
    }
  );
});

app.listen(3001, () => {
  console.log("Backend running on http://localhost:3001");
});
