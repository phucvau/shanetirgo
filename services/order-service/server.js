const crypto = require("crypto");
const http = require("http");
const express = require("express");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const { Sequelize } = require("sequelize");
const { Server: SocketIOServer } = require("socket.io");
const { defineOrderModel } = require("./src/models/order.model");
const { defineAdminUserModel } = require("./src/models/admin-user.model");

const app = express();
const port = Number(process.env.PORT || 4002);
app.use(express.json());
const productServiceUrl = process.env.PRODUCT_SERVICE_URL || "http://localhost:4001";

const mysqlDatabase =
  process.env.MYSQL_DATABASE ||
  process.env.MYSQLDATABASE ||
  "shanetirgo";
const mysqlUser =
  process.env.MYSQL_USER ||
  process.env.MYSQLUSER ||
  "shane";
const mysqlPassword =
  process.env.MYSQL_PASSWORD ||
  process.env.MYSQLPASSWORD ||
  "shane123";
const mysqlHost =
  process.env.MYSQL_HOST ||
  process.env.MYSQLHOST ||
  "localhost";
const mysqlPort = Number(
  process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306
);

const sequelize = new Sequelize(mysqlDatabase, mysqlUser, mysqlPassword, {
  host: mysqlHost,
  port: mysqlPort,
  dialect: "mysql",
  logging: false,
});

const Order = defineOrderModel(sequelize);
const AdminUser = defineAdminUserModel(sequelize);
const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.emit("connected", { ok: true });
});

function normalizeOrder(order) {
  const data = order.toJSON();
  return {
    id: data.id,
    orderCode: data.orderCode || `ORD-${String(data.id).padStart(6, "0")}`,
    customerName: data.customerName,
    phone: data.phone || "",
    city: data.city || "",
    district: data.district || "",
    ward: data.ward || "",
    street: data.street || "",
    addressLine: data.addressLine || "",
    note: data.note || "",
    items: Array.isArray(data.items) ? data.items : [],
    itemCount: Number(data.itemCount || 0),
    totalAmount: Number(data.totalAmount || 0),
    status: data.status || "pending",
    createdAt: data.created_at || data.createdAt,
    updatedAt: data.updated_at || data.updatedAt,
  };
}

function signResetToken(payload) {
  const rawPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret = process.env.ADMIN_RESET_SECRET || "change-this-secret";
  const signature = crypto.createHmac("sha256", secret).update(rawPayload).digest("hex");
  return `${rawPayload}.${signature}`;
}

function verifyResetToken(token) {
  if (!token || !token.includes(".")) return null;
  const [rawPayload, signature] = token.split(".");
  const secret = process.env.ADMIN_RESET_SECRET || "change-this-secret";
  const expected = crypto.createHmac("sha256", secret).update(rawPayload).digest("hex");
  if (expected !== signature) return null;
  try {
    const parsed = JSON.parse(Buffer.from(rawPayload, "base64url").toString("utf8"));
    if (!parsed?.exp || Date.now() > Number(parsed.exp)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendResetEmail(toEmail, resetLink) {
  const transporter = createTransporter();
  if (!transporter) {
    return { sent: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from: fromEmail,
    to: toEmail,
    subject: "ShaneTirgo - Dat lai mat khau admin",
    text: `Nhan vao link de dat lai mat khau: ${resetLink}`,
    html: `<p>Ban vua yeu cau dat lai mat khau admin.</p><p><a href="${resetLink}">Dat lai mat khau</a></p><p>Link co hieu luc trong 15 phut.</p>`,
  });

  return { sent: true };
}

async function decrementProductStock(items) {
  const response = await fetch(`${productServiceUrl}/internal/stock/decrement`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(result?.message || "Cannot decrement product stock");
    err.statusCode = response.status;
    throw err;
  }

  return result;
}

async function compensateProductStock(items) {
  try {
    await fetch(`${productServiceUrl}/internal/stock/increment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
  } catch (_) {
    // ignore compensation failure, only best-effort
  }
}

app.get("/health", async (_, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "ok", service: "order-service" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/orders", async (_, res) => {
  try {
    const rows = await Order.findAll({ order: [["id", "DESC"]] });
    res.status(200).json(rows.map(normalizeOrder));
  } catch (error) {
    res.status(500).json({ message: "Cannot fetch orders", error: error.message });
  }
});

app.get("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    return res.status(200).json(normalizeOrder(order));
  } catch (error) {
    return res.status(500).json({ message: "Cannot fetch order detail", error: error.message });
  }
});

app.post("/orders", async (req, res) => {
  const {
    customerName,
    phone,
    city,
    district,
    ward,
    street,
    addressLine,
    note,
    items,
    totalAmount,
  } = req.body || {};

  const normalizedItems = Array.isArray(items) ? items : [];
  const itemCount = normalizedItems.reduce((sum, item) => sum + Number(item?.quantity || 0), 0);
  const computedTotal = normalizedItems.reduce(
    (sum, item) => sum + Number(item?.price || 0) * Number(item?.quantity || 0),
    0
  );
  const finalTotal = typeof totalAmount === "number" ? totalAmount : computedTotal;

  if (!customerName || !phone || !city || !district || !ward || !street || itemCount <= 0) {
    return res.status(400).json({
      message: "customerName, phone, city, district, ward, street, items are required",
    });
  }

  try {
    const stockPayload = normalizedItems.map((item) => ({
      productId: Number(item?.productId || 0),
      quantity: Number(item?.quantity || 0),
      size: String(item?.size || ""),
      color: String(item?.color || ""),
    }));
    const stockResult = await decrementProductStock(stockPayload);
    try {
      const order = await Order.create({
        customerName: String(customerName),
        phone: String(phone),
        city: String(city),
        district: String(district),
        ward: String(ward),
        street: String(street),
        addressLine: String(addressLine || `${street}, ${ward}, ${district}, ${city}`),
        note: note ? String(note) : "",
        items: normalizedItems,
        itemCount,
        totalAmount: Number(finalTotal),
        status: "pending",
      });

      if (!order.orderCode) {
        const generatedOrderCode = `ORD-${String(order.id).padStart(6, "0")}`;
        await order.update({ orderCode: generatedOrderCode });
      }

      const normalizedOrder = normalizeOrder(order);
      io.emit("order:new", normalizedOrder);
      const stockAlerts = Array.isArray(stockResult?.alerts) ? stockResult.alerts : [];
      stockAlerts.forEach((alert) => {
        io.emit("stock:alert", {
          type: String(alert?.type || ""),
          productId: Number(alert?.productId || 0),
          name: String(alert?.name || ""),
          stock: Number(alert?.stock || 0),
        });
      });
      return res.status(201).json(normalizedOrder);
    } catch (error) {
      await compensateProductStock(stockPayload);
      throw error;
    }
  } catch (error) {
    const statusCode = Number(error?.statusCode || 500);
    if (statusCode !== 500) {
      return res.status(statusCode).json({ message: error.message });
    }
    return res.status(500).json({ message: "Cannot create order", error: error.message });
  }
});

app.patch("/orders/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const nextStatus = String(req.body?.status || "").toLowerCase();

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid order id" });
  }
  if (!validStatuses.includes(nextStatus)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    await order.update({ status: nextStatus });
    return res.status(200).json(normalizeOrder(order));
  } catch (error) {
    return res.status(500).json({ message: "Cannot update order status", error: error.message });
  }
});

app.delete("/orders/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  try {
    const order = await Order.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    await order.destroy();
    return res.status(200).json({ message: "Order deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Cannot delete order", error: error.message });
  }
});

app.post("/admin-auth/login", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  try {
    const admin = await AdminUser.findOne({ where: { username } });
    if (!admin) {
      return res.status(401).json({ message: "Sai thong tin dang nhap" });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Sai thong tin dang nhap" });
    }

    return res.status(200).json({
      ok: true,
      user: { username: admin.username, email: admin.email },
    });
  } catch (error) {
    return res.status(500).json({ message: "Cannot login admin", error: error.message });
  }
});

app.post("/admin-auth/forgot-password", async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: "email is required" });
  }

  try {
    const admin = await AdminUser.findOne({ where: { email } });
    if (!admin) {
      return res.status(200).json({ ok: true, message: "Neu email ton tai, link dat lai mat khau da duoc gui." });
    }

    const payload = {
      sub: String(admin.id),
      email: admin.email,
      exp: Date.now() + 15 * 60 * 1000,
    };
    const token = signResetToken(payload);
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    await admin.update({
      resetTokenHash: tokenHash,
      resetTokenExpiresAt: new Date(payload.exp),
    });

    const baseUrl = process.env.WEB_BASE_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/admin/reset-password?token=${encodeURIComponent(token)}`;
    const emailResult = await sendResetEmail(admin.email, resetLink);

    if (!emailResult.sent) {
      return res.status(500).json({
        message: "SMTP chua duoc cau hinh. Khong the gui email reset.",
      });
    }

    return res.status(200).json({ ok: true, message: "Da gui email dat lai mat khau." });
  } catch (error) {
    return res.status(500).json({ message: "Cannot process forgot password", error: error.message });
  }
});

app.post("/admin-auth/reset-password", async (req, res) => {
  const token = String(req.body?.token || "");
  const newPassword = String(req.body?.newPassword || "");

  if (!token || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "token and newPassword(min 6) are required" });
  }

  try {
    const payload = verifyResetToken(token);
    if (!payload) {
      return res.status(400).json({ message: "Token khong hop le hoac da het han" });
    }

    const admin = await AdminUser.findOne({ where: { email: String(payload.email || "") } });
    if (!admin) {
      return res.status(400).json({ message: "Token khong hop le" });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (!admin.resetTokenHash || admin.resetTokenHash !== tokenHash) {
      return res.status(400).json({ message: "Token khong hop le" });
    }

    if (!admin.resetTokenExpiresAt || new Date(admin.resetTokenExpiresAt).getTime() < Date.now()) {
      return res.status(400).json({ message: "Token da het han" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await admin.update({
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    });

    return res.status(200).json({ ok: true, message: "Dat lai mat khau thanh cong" });
  } catch (error) {
    return res.status(500).json({ message: "Cannot reset password", error: error.message });
  }
});

async function seedDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const email = process.env.ADMIN_EMAIL || "phucvau16032003@gmail.com";
  const rawPassword = process.env.ADMIN_PASSWORD || "cent1996";

  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const existing = await AdminUser.findOne({ where: { username } });

  if (!existing) {
    await AdminUser.create({
      username,
      email,
      passwordHash,
    });
    return;
  }

  await existing.update({
    email,
    passwordHash,
  });
}

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await seedDefaultAdmin();
    httpServer.listen(port, () => {
      console.log(`order-service listening on ${port}`);
    });
  } catch (error) {
    console.error("Cannot start order-service:", error);
    process.exit(1);
  }
}

bootstrap();
