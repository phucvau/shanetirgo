const express = require("express");
const { Sequelize } = require("sequelize");
const { defineOrderModel } = require("./src/models/order.model");

const app = express();
const port = Number(process.env.PORT || 4002);
app.use(express.json());

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
const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

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

    return res.status(201).json(normalizeOrder(order));
  } catch (error) {
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

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    app.listen(port, () => {
      console.log(`order-service listening on ${port}`);
    });
  } catch (error) {
    console.error("Cannot start order-service:", error);
    process.exit(1);
  }
}

bootstrap();
