const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { Sequelize } = require("sequelize");
const { Op } = require("sequelize");
const { defineProductModel } = require("./src/models/product.model");

const app = express();
const port = Number(process.env.PORT || 4001);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.use(cors());
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
  process.env.MYSQL_PORT ||
    process.env.MYSQLPORT ||
    3306
);

const sequelize = new Sequelize(mysqlDatabase, mysqlUser, mysqlPassword, {
  host: mysqlHost,
  port: mysqlPort,
  dialect: "mysql",
  logging: false,
});

const Product = defineProductModel(sequelize);

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function uploadToCloudinary(fileBuffer, originalName) {
  return new Promise((resolve, reject) => {
    const baseName = String(originalName || "image")
      .split(".")
      .slice(0, -1)
      .join(".")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "image";

    const publicId = `${Date.now()}-${baseName}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "shanetirgo/products",
        public_id: publicId,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
}

function getCloudinaryPublicIdFromUrl(imageUrl) {
  try {
    if (!imageUrl || !imageUrl.includes("/upload/")) return null;
    const url = new URL(imageUrl);
    if (!url.hostname.includes("res.cloudinary.com")) return null;

    const marker = "/upload/";
    const idx = url.pathname.indexOf(marker);
    if (idx < 0) return null;
    let pathAfterUpload = url.pathname.slice(idx + marker.length);

    // Remove version prefix like v1234567890/
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, "");

    // Remove extension
    pathAfterUpload = pathAfterUpload.replace(/\.[a-zA-Z0-9]+$/, "");
    return pathAfterUpload || null;
  } catch (_) {
    return null;
  }
}

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
  if (!isCloudinaryConfigured()) {
    return res.status(500).json({
      message: "Cloudinary is not configured",
      error: "Missing CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET",
    });
  }

  try {
    const uploaded = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    return res.status(201).json({ imageUrl: uploaded.secure_url, publicId: uploaded.public_id });
  } catch (error) {
    return res.status(500).json({ message: "Cannot upload image", error: error.message });
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

app.delete("/products/:id", async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const imageUrl = String(product.imageUrl || "");
    const publicId = getCloudinaryPublicIdFromUrl(imageUrl);
    if (publicId && isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    }

    await product.destroy();
    return res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Cannot delete product", error: error.message });
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
    console.error("Cannot start product-service:", error);
    process.exit(1);
  }
}

bootstrap();
