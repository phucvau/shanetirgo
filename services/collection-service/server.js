const express = require("express");
const { Sequelize, Op } = require("sequelize");
const { defineCollectionModel } = require("./src/models/collection.model");

const app = express();
const port = Number(process.env.PORT || 4004);
app.use(express.json());

const mysqlDatabase = process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || "shanetirgo";
const mysqlUser = process.env.MYSQL_USER || process.env.MYSQLUSER || "shane";
const mysqlPassword = process.env.MYSQL_PASSWORD || process.env.MYSQLPASSWORD || "shane123";
const mysqlHost = process.env.MYSQL_HOST || process.env.MYSQLHOST || "localhost";
const mysqlPort = Number(process.env.MYSQL_PORT || process.env.MYSQLPORT || 3306);

const sequelize = new Sequelize(mysqlDatabase, mysqlUser, mysqlPassword, {
  host: mysqlHost,
  port: mysqlPort,
  dialect: "mysql",
  logging: false,
});

const Collection = defineCollectionModel(sequelize);

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeProductIds(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  );
}

function parseStoredProductIds(raw) {
  try {
    const parsed = JSON.parse(String(raw || "[]"));
    return normalizeProductIds(parsed);
  } catch {
    return [];
  }
}

function toResponse(row) {
  const productIds = parseStoredProductIds(row.productIds);
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.imageUrl,
    productIds,
    productCount: productIds.length,
    isActive: Boolean(row.isActive),
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
  };
}

async function buildUniqueSlug(name, excludeId) {
  const baseSlug = slugify(name) || "collection";
  const where = {
    slug: {
      [Op.like]: `${baseSlug}%`,
    },
  };

  if (excludeId) {
    where.id = {
      [Op.ne]: excludeId,
    };
  }

  const sameSlugCount = await Collection.count({ where });
  return sameSlugCount > 0 ? `${baseSlug}-${sameSlugCount + 1}` : baseSlug;
}

app.get("/health", async (_, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "ok", service: "collection-service" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/collections", async (_, res) => {
  try {
    const rows = await Collection.findAll({ order: [["id", "DESC"]] });
    return res.status(200).json(rows.map(toResponse));
  } catch (error) {
    return res.status(500).json({ message: "Cannot fetch collections", error: error.message });
  }
});

app.get("/collections/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid collection id" });
  }

  try {
    const row = await Collection.findByPk(id);
    if (!row) {
      return res.status(404).json({ message: "Collection not found" });
    }
    return res.status(200).json(toResponse(row));
  } catch (error) {
    return res.status(500).json({ message: "Cannot fetch collection", error: error.message });
  }
});

app.post("/collections", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const description = String(req.body?.description || "").trim();
  const imageUrl = String(req.body?.imageUrl || "").trim();
  const productIds = normalizeProductIds(req.body?.productIds || []);
  const isActive = req.body?.isActive === undefined ? true : Boolean(req.body?.isActive);

  if (!name || !description || !imageUrl) {
    return res.status(400).json({ message: "name, description, imageUrl are required" });
  }

  try {
    const slug = await buildUniqueSlug(name);
    const row = await Collection.create({
      name,
      slug,
      description,
      imageUrl,
      productIds: JSON.stringify(productIds),
      isActive,
    });
    return res.status(201).json(toResponse(row));
  } catch (error) {
    return res.status(500).json({ message: "Cannot create collection", error: error.message });
  }
});

app.patch("/collections/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid collection id" });
  }

  try {
    const row = await Collection.findByPk(id);
    if (!row) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const updates = {};

    if (req.body?.name !== undefined) {
      const name = String(req.body?.name || "").trim();
      if (!name) return res.status(400).json({ message: "name is invalid" });
      if (name !== row.name) {
        updates.name = name;
        updates.slug = await buildUniqueSlug(name, id);
      }
    }

    if (req.body?.description !== undefined) {
      updates.description = String(req.body?.description || "").trim();
    }

    if (req.body?.imageUrl !== undefined) {
      const imageUrl = String(req.body?.imageUrl || "").trim();
      if (!imageUrl) return res.status(400).json({ message: "imageUrl is invalid" });
      updates.imageUrl = imageUrl;
    }

    if (req.body?.productIds !== undefined) {
      updates.productIds = JSON.stringify(normalizeProductIds(req.body?.productIds));
    }

    if (req.body?.isActive !== undefined) {
      updates.isActive = Boolean(req.body?.isActive);
    }

    await row.update(updates);
    return res.status(200).json(toResponse(row));
  } catch (error) {
    return res.status(500).json({ message: "Cannot update collection", error: error.message });
  }
});

app.delete("/collections/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid collection id" });
  }

  try {
    const row = await Collection.findByPk(id);
    if (!row) {
      return res.status(404).json({ message: "Collection not found" });
    }

    await row.destroy();
    return res.status(200).json({ message: "Collection deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Cannot delete collection", error: error.message });
  }
});

const defaultCollections = [
  {
    name: "Xuân Hè 2026",
    description: "Những thiết kế thoáng mát, phóng khoáng cho ngày nắng.",
    imageUrl: "/images/collection-1.jpg",
  },
  {
    name: "Thu Đông 2026",
    description: "Ấm áp, cá tính với tông màu trầm ấm.",
    imageUrl: "/images/collection-2.jpg",
  },
  {
    name: "Phụ kiện",
    description: "Điểm nhấn hoàn hảo cho mọi trang phục.",
    imageUrl: "/images/collection-3.jpg",
  },
];

async function seedCollections() {
  const count = await Collection.count();
  if (count > 0) return;

  for (const item of defaultCollections) {
    await Collection.create({
      name: item.name,
      slug: slugify(item.name),
      description: item.description,
      imageUrl: item.imageUrl,
      productIds: "[]",
      isActive: true,
    });
  }
}

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await seedCollections();
    app.listen(port, () => {
      console.log(`collection-service listening on ${port}`);
    });
  } catch (error) {
    console.error("Cannot start collection-service:", error);
    process.exit(1);
  }
}

bootstrap();
