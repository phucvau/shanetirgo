const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { Sequelize } = require("sequelize");
const { Op } = require("sequelize");
const { defineProductModel } = require("./src/models/product.model");

const app = express();
const port = Number(process.env.PORT || 4001);
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
const uploadDir = path.join(__dirname, "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || "shanetirgo",
  process.env.MYSQL_USER || "shane",
  process.env.MYSQL_PASSWORD || "shane123",
  {
  host: process.env.MYSQL_HOST || "localhost",
  port: Number(process.env.MYSQL_PORT || 3306),
    dialect: "mysql",
    logging: false,
  }
);

const Product = defineProductModel(sequelize);

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

app.get("/health", async (_, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "ok", service: "product-service" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/products", async (_, res) => {
  try {
    const products = await Product.findAll({
      order: [["id", "DESC"]],
    });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Cannot fetch products", error: error.message });
  }
});

app.get("/products/:slug", async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { slug: req.params.slug },
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    return res.status(500).json({ message: "Cannot fetch product detail", error: error.message });
  }
});

app.post("/upload-image", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    const ext = path.extname(req.file.originalname || "");
    const safeBase = (path.basename(req.file.originalname || "image", ext) || "image")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const filename = `${Date.now()}-${safeBase}${ext || ".jpg"}`;
    fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);

    const imageUrl = `${publicBaseUrl}/uploads/${filename}`;
    return res.status(201).json({ imageUrl });
  } catch (error) {
    return res.status(500).json({ message: "Cannot save image", error: error.message });
  }
});

app.post("/products", async (req, res) => {
  const { name, price, stock, size, material, category, description, colors, imageUrl, isNew } = req.body || {};
  if (
    !name ||
    typeof price !== "number" ||
    typeof stock !== "number" ||
    !size ||
    !material ||
    !category ||
    !description ||
    !imageUrl
  ) {
    return res
      .status(400)
      .json({ message: "name, price, stock, size, material, category, description, imageUrl are required" });
  }

  try {
    const baseSlug = slugify(name) || "product";
    const sameSlugCount = await Product.count({
      where: {
        slug: {
          [Op.like]: `${baseSlug}%`,
        },
      },
    });
    const slug = sameSlugCount > 0 ? `${baseSlug}-${sameSlugCount + 1}` : baseSlug;

    const product = await Product.create({
      name,
      slug,
      price: Number(price),
      stock: Number(stock),
      size: String(size),
      material: String(material),
      category: String(category),
      description: String(description),
      colors: colors ? String(colors) : "",
      imageUrl: String(imageUrl),
      isNew: typeof isNew === "boolean" ? isNew : false,
    });
    return res.status(201).json(product);
  } catch (error) {
    return res.status(500).json({ message: "Cannot create product", error: error.message });
  }
});

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    app.listen(port, () => {
      console.log(`product-service listening on ${port}`);
    });
  } catch (error) {
    console.error("Cannot start product-service:", error.message);
    process.exit(1);
  }
}

bootstrap();
