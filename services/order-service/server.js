const express = require("express");
const mysql = require("mysql2/promise");

const app = express();
const port = Number(process.env.PORT || 4002);
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "shane",
  password: process.env.MYSQL_PASSWORD || "shane123",
  database: process.env.MYSQL_DATABASE || "shanetirgo",
  waitForConnections: true,
  connectionLimit: 10,
});

app.get("/health", async (_, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", service: "order-service" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/orders", async (_, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, customer_name AS customerName, total_amount AS totalAmount, status, created_at AS createdAt FROM orders ORDER BY id DESC"
    );
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Cannot fetch orders", error: error.message });
  }
});

app.post("/orders", async (req, res) => {
  const { customerName, totalAmount } = req.body || {};

  if (!customerName || typeof totalAmount !== "number") {
    return res.status(400).json({ message: "customerName and totalAmount are required" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO orders (customer_name, total_amount, status) VALUES (?, ?, ?)",
      [customerName, totalAmount, "PENDING"]
    );
    return res.status(201).json({ id: result.insertId, customerName, totalAmount, status: "PENDING" });
  } catch (error) {
    return res.status(500).json({ message: "Cannot create order", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`order-service listening on ${port}`);
});
