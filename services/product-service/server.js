const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { Sequelize } = require("sequelize");
const { Op } = require("sequelize");
const { defineProductModel } = require("./src/models/product.model");

const app = express();
const port = Number(process.env.PORT || 4001);

const cloudinaryCloudName =
  process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD || process.env.CLOUD_NAME || "";
const cloudinaryApiKey =
  process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_KEY || process.env.API_KEY || "";
const cloudinaryApiSecret =
  process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET || process.env.API_SECRET || "";

cloudinary.config({
  cloud_name: cloudinaryCloudName,
  api_key: cloudinaryApiKey,
  api_secret: cloudinaryApiSecret,
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
const allowedProductStatuses = ["normal", "new", "hot", "sale"];

function isCloudinaryConfigured() {
  return Boolean(cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret);
}

function getCloudinaryErrorMessage(error) {
  if (!error) return "Unknown error";
  if (typeof error.message === "string" && error.message.trim()) return error.message;
  if (error.error && typeof error.error.message === "string" && error.error.message.trim()) {
    return error.error.message;
  }
  try {
    return JSON.stringify(error);
  } catch (_) {
    return "Unknown Cloudinary error";
  }
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

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function normalizeProduct(product) {
  const data = product.toJSON();
  const parsedImages = parseJsonArray(data.imageUrls).filter(Boolean).map((item) => String(item));
  const parsedVariants = parseJsonArray(data.variantStocks);
  const imageUrls = parsedImages.length > 0 ? parsedImages : data.imageUrl ? [String(data.imageUrl)] : [];
  const fallbackStatus = data.isNew ? "new" : "normal";
  const status = allowedProductStatuses.includes(String(data.productStatus || ""))
    ? String(data.productStatus)
    : fallbackStatus;
  const salePrice = data.salePrice === null || data.salePrice === undefined ? null : Number(data.salePrice);
  return {
    ...data,
    imageUrl: imageUrls[0] || data.imageUrl || "",
    imageUrls,
    variantStocks: parsedVariants,
    productStatus: status,
    salePrice: Number.isFinite(salePrice) ? salePrice : null,
    description: String(data.description || ""),
    lowStockNotified: Boolean(data.lowStockNotified),
    outOfStockNotified: Boolean(data.outOfStockNotified),
  };
}

function normalizeVariantValue(value) {
  return String(value || "").trim().toLowerCase();
}

function resolveAlertState({ previousStock, nextStock, lowNotified, outNotified }) {
  let nextLowNotified = Boolean(lowNotified);
  let nextOutNotified = Boolean(outNotified);
  let alert = null;

  if (Number(nextStock) > Number(previousStock) || Number(nextStock) > 5) {
    nextLowNotified = false;
    nextOutNotified = false;
  }

  if (Number(nextStock) === 0) {
    if (!nextOutNotified) {
      alert = "out_of_stock";
      nextOutNotified = true;
    }
  } else if (Number(nextStock) <= 5) {
    if (!nextLowNotified) {
      alert = "low_stock";
      nextLowNotified = true;
    }
  }

  return { nextLowNotified, nextOutNotified, alert };
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isAccessoryCategory(category) {
  const normalized = normalizeText(category);
  return normalized.includes("phu kien");
}

function buildProductPayload(rawInput, currentProduct) {
  const input = rawInput || {};
  const name = input.name ?? currentProduct?.name;
  const price = input.price ?? currentProduct?.price;
  const stock = input.stock ?? currentProduct?.stock;
  const size = input.size ?? currentProduct?.size;
  const material = input.material ?? currentProduct?.material;
  const category = input.category ?? currentProduct?.category;
  const description = input.description ?? currentProduct?.description;
  const colors = input.colors ?? currentProduct?.colors;
  const imageUrl = input.imageUrl ?? currentProduct?.imageUrl;
  const imageUrls = input.imageUrls ?? currentProduct?.imageUrls;
  const variantStocks = input.variantStocks ?? currentProduct?.variantStocks;
  const isNew = input.isNew ?? currentProduct?.isNew;
  const salePriceInput = input.salePrice ?? currentProduct?.salePrice;

  const statusInput = String(input.productStatus || "").trim().toLowerCase();
  const legacyStatus = typeof isNew === "boolean" ? (isNew ? "new" : "normal") : "normal";
  const productStatus = allowedProductStatuses.includes(statusInput)
    ? statusInput
    : currentProduct?.productStatus && allowedProductStatuses.includes(String(currentProduct.productStatus))
      ? String(currentProduct.productStatus)
      : legacyStatus;

  const isAccessory = isAccessoryCategory(category);
  const normalizedVariants = Array.isArray(variantStocks)
    ? variantStocks
        .map((item) => ({
          size: String(item?.size || "").trim(),
          color: String(item?.color || "").trim(),
          stock: Number(item?.stock || 0),
        }))
        .filter((item) => item.stock >= 0 && (item.size || item.color))
    : [];

  const hasInvalidVariant = normalizedVariants.some((item) => !Number.isFinite(item.stock) || item.stock < 0);
  if (hasInvalidVariant) {
    return { error: "variantStocks is invalid" };
  }

  if (!isAccessory && normalizedVariants.length === 0) {
    return { error: "San pham quan ao phai co it nhat 1 bien the (size, mau, ton kho)" };
  }
  if (!isAccessory && normalizedVariants.some((item) => !item.size || !item.color)) {
    return { error: "San pham quan ao yeu cau size va mau cho tung bien the" };
  }

  const stockFromVariants = normalizedVariants.reduce((sum, item) => sum + item.stock, 0);
  const finalStock = normalizedVariants.length > 0 ? stockFromVariants : Number(stock);
  const uniqueSizes = [...new Set(normalizedVariants.map((item) => item.size).filter(Boolean))];
  const uniqueColors = [...new Set(normalizedVariants.map((item) => item.color).filter(Boolean))];
  const finalSize = uniqueSizes.length > 0 ? uniqueSizes.join(",") : String(size || "").trim();
  const finalColors = uniqueColors.length > 0 ? uniqueColors.join(",") : String(colors || "").trim();

  const normalizedImageUrls = Array.isArray(imageUrls)
    ? imageUrls.map((item) => String(item || "").trim()).filter(Boolean)
    : parseJsonArray(imageUrls).map((item) => String(item || "").trim()).filter(Boolean);
  if (normalizedImageUrls.length === 0 && imageUrl) {
    normalizedImageUrls.push(String(imageUrl).trim());
  }
  const finalImageUrl = normalizedImageUrls[0] || "";

  const priceNumber = Number(price);
  const salePriceNumber =
    salePriceInput === null || salePriceInput === undefined || salePriceInput === ""
      ? null
      : Number(salePriceInput);
  if (salePriceNumber !== null && (!Number.isFinite(salePriceNumber) || salePriceNumber < 0)) {
    return { error: "salePrice is invalid" };
  }

  if (
    !name ||
    !Number.isFinite(priceNumber) ||
    priceNumber < 0 ||
    !material ||
    !category ||
    !description ||
    !finalImageUrl ||
    !Number.isFinite(finalStock) ||
    finalStock < 0
  ) {
    return { error: "name, price, stock/material/category/description/imageUrl are required" };
  }

  return {
    data: {
      name: String(name),
      price: priceNumber,
      salePrice: salePriceNumber,
      stock: Number(finalStock),
      size: finalSize,
      material: String(material),
      category: String(category),
      description: String(description),
      colors: finalColors,
      imageUrl: finalImageUrl,
      imageUrls: JSON.stringify(normalizedImageUrls),
      variantStocks: JSON.stringify(normalizedVariants),
      productStatus,
      isNew: productStatus === "new",
    },
  };
}

app.get("/health", async (_, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      status: "ok",
      service: "product-service",
      cloudinaryConfigured: isCloudinaryConfigured(),
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/cloudinary-health", async (_, res) => {
  if (!isCloudinaryConfigured()) {
    return res.status(500).json({
      status: "error",
      message: "Cloudinary is not configured",
    });
  }

  try {
    await cloudinary.api.ping();
    return res.status(200).json({
      status: "ok",
      cloudinaryConfigured: true,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Cloudinary auth failed",
      error: getCloudinaryErrorMessage(error),
    });
  }
});

app.post("/internal/stock/decrement", async (req, res) => {
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  if (rawItems.length === 0) {
    return res.status(400).json({ message: "items are required" });
  }

  const tx = await sequelize.transaction();
  try {
    const alerts = [];
    const updatedProducts = [];

    for (const rawItem of rawItems) {
      const productId = Number(rawItem?.productId || 0);
      const quantity = Number(rawItem?.quantity || 0);
      const size = String(rawItem?.size || "").trim();
      const color = String(rawItem?.color || "").trim();

      if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
        throw Object.assign(new Error("Invalid stock payload"), { statusCode: 400 });
      }

      const product = await Product.findByPk(productId, {
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      if (!product) {
        throw Object.assign(new Error(`Product ${productId} not found`), { statusCode: 404 });
      }

      const prevStock = Number(product.stock || 0);
      const parsedVariants = parseJsonArray(product.variantStocks).map((item) => ({
        size: String(item?.size || "").trim(),
        color: String(item?.color || "").trim(),
        stock: Number(item?.stock || 0),
      }));

      let nextStock = prevStock;
      let nextVariants = parsedVariants;
      if (parsedVariants.length > 0) {
        const targetIndex = parsedVariants.findIndex(
          (item) =>
            normalizeVariantValue(item.size) === normalizeVariantValue(size) &&
            normalizeVariantValue(item.color) === normalizeVariantValue(color)
        );
        if (targetIndex < 0) {
          throw Object.assign(
            new Error(`Variant not found for product ${productId} (${color}/${size})`),
            { statusCode: 400 }
          );
        }
        const target = parsedVariants[targetIndex];
        if (Number(target.stock || 0) < quantity) {
          throw Object.assign(
            new Error(`Insufficient stock for ${product.name} (${color}/${size})`),
            { statusCode: 409 }
          );
        }
        target.stock = Number(target.stock || 0) - quantity;
        nextVariants = parsedVariants;
        nextStock = nextVariants.reduce((sum, item) => sum + Number(item.stock || 0), 0);
      } else {
        if (prevStock < quantity) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { statusCode: 409 });
        }
        nextStock = prevStock - quantity;
      }

      const alertState = resolveAlertState({
        previousStock: prevStock,
        nextStock,
        lowNotified: product.lowStockNotified,
        outNotified: product.outOfStockNotified,
      });

      await product.update(
        {
          stock: nextStock,
          variantStocks: JSON.stringify(nextVariants),
          lowStockNotified: alertState.nextLowNotified,
          outOfStockNotified: alertState.nextOutNotified,
        },
        { transaction: tx }
      );

      if (alertState.alert) {
        alerts.push({
          type: alertState.alert,
          productId: product.id,
          name: product.name,
          stock: nextStock,
        });
      }

      updatedProducts.push({
        productId: product.id,
        stock: nextStock,
      });
    }

    await tx.commit();
    return res.status(200).json({ ok: true, updatedProducts, alerts });
  } catch (error) {
    await tx.rollback();
    const statusCode = Number(error?.statusCode || 500);
    return res.status(statusCode).json({ message: error.message || "Cannot decrement stock" });
  }
});

app.post("/internal/stock/increment", async (req, res) => {
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  if (rawItems.length === 0) {
    return res.status(400).json({ message: "items are required" });
  }

  const tx = await sequelize.transaction();
  try {
    for (const rawItem of rawItems) {
      const productId = Number(rawItem?.productId || 0);
      const quantity = Number(rawItem?.quantity || 0);
      const size = String(rawItem?.size || "").trim();
      const color = String(rawItem?.color || "").trim();

      if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
        throw Object.assign(new Error("Invalid stock payload"), { statusCode: 400 });
      }

      const product = await Product.findByPk(productId, {
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      if (!product) continue;

      const prevStock = Number(product.stock || 0);
      const parsedVariants = parseJsonArray(product.variantStocks).map((item) => ({
        size: String(item?.size || "").trim(),
        color: String(item?.color || "").trim(),
        stock: Number(item?.stock || 0),
      }));

      let nextStock = prevStock;
      let nextVariants = parsedVariants;
      if (parsedVariants.length > 0) {
        const targetIndex = parsedVariants.findIndex(
          (item) =>
            normalizeVariantValue(item.size) === normalizeVariantValue(size) &&
            normalizeVariantValue(item.color) === normalizeVariantValue(color)
        );
        if (targetIndex >= 0) {
          parsedVariants[targetIndex].stock = Number(parsedVariants[targetIndex].stock || 0) + quantity;
        }
        nextVariants = parsedVariants;
        nextStock = nextVariants.reduce((sum, item) => sum + Number(item.stock || 0), 0);
      } else {
        nextStock = prevStock + quantity;
      }

      const alertState = resolveAlertState({
        previousStock: prevStock,
        nextStock,
        lowNotified: product.lowStockNotified,
        outNotified: product.outOfStockNotified,
      });

      await product.update(
        {
          stock: nextStock,
          variantStocks: JSON.stringify(nextVariants),
          lowStockNotified: alertState.nextLowNotified,
          outOfStockNotified: alertState.nextOutNotified,
        },
        { transaction: tx }
      );
    }

    await tx.commit();
    return res.status(200).json({ ok: true });
  } catch (error) {
    await tx.rollback();
    const statusCode = Number(error?.statusCode || 500);
    return res.status(statusCode).json({ message: error.message || "Cannot increment stock" });
  }
});

app.get("/products", async (_, res) => {
  try {
    const products = await Product.findAll({
      order: [["id", "DESC"]],
    });
    res.status(200).json(products.map(normalizeProduct));
  } catch (error) {
    res.status(500).json({ message: "Cannot fetch products", error: error.message });
  }
});

app.get("/products/id/:id", async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product id" });
  }
  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(normalizeProduct(product));
  } catch (error) {
    return res.status(500).json({ message: "Cannot fetch product", error: error.message });
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
    return res.status(200).json(normalizeProduct(product));
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
    console.error("Cloudinary upload failed:", error);
    return res.status(500).json({
      message: "Cannot upload image",
      error: getCloudinaryErrorMessage(error),
    });
  }
});

app.post("/products", async (req, res) => {
  const built = buildProductPayload(req.body || {}, null);
  if (built.error) {
    return res.status(400).json({ message: built.error });
  }

  try {
    const payload = built.data;
    const baseSlug = slugify(payload.name) || "product";
    const sameSlugCount = await Product.count({
      where: {
        slug: {
          [Op.like]: `${baseSlug}%`,
        },
      },
    });
    const slug = sameSlugCount > 0 ? `${baseSlug}-${sameSlugCount + 1}` : baseSlug;

    const product = await Product.create({
      ...payload,
      slug,
      lowStockNotified: false,
      outOfStockNotified: false,
    });
    return res.status(201).json(normalizeProduct(product));
  } catch (error) {
    return res.status(500).json({ message: "Cannot create product", error: error.message });
  }
});

app.patch("/products/:id", async (req, res) => {
  const productId = Number(req.params.id);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product id" });
  }

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const current = normalizeProduct(product);
    const built = buildProductPayload(req.body || {}, current);
    if (built.error) {
      return res.status(400).json({ message: built.error });
    }

    const nextName = String((req.body || {}).name || current.name);
    if (normalizeText(nextName) !== normalizeText(current.name)) {
      const baseSlug = slugify(nextName) || "product";
      const sameSlugCount = await Product.count({
        where: {
          slug: {
            [Op.like]: `${baseSlug}%`,
          },
          id: {
            [Op.ne]: productId,
          },
        },
      });
      built.data.slug = sameSlugCount > 0 ? `${baseSlug}-${sameSlugCount + 1}` : baseSlug;
    }

    const currentStock = Number(current.stock || 0);
    const nextStock = Number(built.data.stock || 0);
    if (nextStock > currentStock || nextStock > 5) {
      built.data.lowStockNotified = false;
      built.data.outOfStockNotified = false;
    }

    await product.update(built.data);
    return res.status(200).json(normalizeProduct(product));
  } catch (error) {
    return res.status(500).json({ message: "Cannot update product", error: error.message });
  }
});

app.patch("/products/:id/status", async (req, res) => {
  const productId = Number(req.params.id);
  const nextStatus = String(req.body?.productStatus || "").toLowerCase();
  const salePriceInput = req.body?.salePrice;
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ message: "Invalid product id" });
  }
  if (!allowedProductStatuses.includes(nextStatus)) {
    return res.status(400).json({ message: "Invalid productStatus" });
  }

  const parsedSalePrice =
    salePriceInput === null || salePriceInput === undefined || salePriceInput === ""
      ? null
      : Number(salePriceInput);
  if (parsedSalePrice !== null && (!Number.isFinite(parsedSalePrice) || parsedSalePrice < 0)) {
    return res.status(400).json({ message: "salePrice is invalid" });
  }

  try {
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    await product.update({
      productStatus: nextStatus,
      salePrice: parsedSalePrice,
      isNew: nextStatus === "new",
    });
    return res.status(200).json(normalizeProduct(product));
  } catch (error) {
    return res.status(500).json({ message: "Cannot update product status", error: error.message });
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

app.use((error, _, res, __) => {
  if (error && error.name === "MulterError") {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image is too large. Max size is 5MB." });
    }
    return res.status(400).json({ message: "Upload failed", error: error.message });
  }
  if (error) {
    return res.status(500).json({ message: "Unexpected server error", error: error.message });
  }
  return res.status(500).json({ message: "Unexpected server error" });
});
