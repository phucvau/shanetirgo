const express = require("express");
const { Sequelize, Op } = require("sequelize");
const { defineCategoryModel } = require("./src/models/category.model");

const app = express();
const port = Number(process.env.PORT || 4003);
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

const Category = defineCategoryModel(sequelize);

const defaultCategories = ["Áo", "Quần", "Váy", "Sweater", "Hoodie", "Sơ mi", "Phụ kiện", "Giày", "Dép"];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

app.get("/health", async (_, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: "ok", service: "category-service" });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/categories", async (_, res) => {
  try {
    const rows = await Category.findAll({ order: [["name", "ASC"]] });
    res.status(200).json(rows);
  } catch (error) {
    res.status(500).json({ message: "Cannot fetch categories", error: error.message });
  }
});

app.get("/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid category id" });
  }
  try {
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ message: "Cannot fetch category", error: error.message });
  }
});

app.post("/categories", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  try {
    const baseSlug = slugify(name) || "category";
    const count = await Category.count({
      where: {
        slug: {
          [Op.like]: `${baseSlug}%`,
        },
      },
    });
    const slug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;
    const category = await Category.create({ name, slug, isActive: true });
    return res.status(201).json(category);
  } catch (error) {
    return res.status(500).json({ message: "Cannot create category", error: error.message });
  }
});

app.patch("/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  const name = req.body?.name === undefined ? undefined : String(req.body?.name || "").trim();
  const isActive = req.body?.isActive;

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid category id" });
  }
  if (name !== undefined && !name) {
    return res.status(400).json({ message: "name is invalid" });
  }

  try {
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const updates = {};
    if (name !== undefined && name !== category.name) {
      updates.name = name;
      const baseSlug = slugify(name) || "category";
      const count = await Category.count({
        where: {
          slug: {
            [Op.like]: `${baseSlug}%`,
          },
          id: {
            [Op.ne]: id,
          },
        },
      });
      updates.slug = count > 0 ? `${baseSlug}-${count + 1}` : baseSlug;
    }
    if (typeof isActive === "boolean") {
      updates.isActive = isActive;
    }

    await category.update(updates);
    return res.status(200).json(category);
  } catch (error) {
    return res.status(500).json({ message: "Cannot update category", error: error.message });
  }
});

app.delete("/categories/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid category id" });
  }
  try {
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    await category.destroy();
    return res.status(200).json({ message: "Category deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Cannot delete category", error: error.message });
  }
});

async function seedDefaultCategories() {
  const count = await Category.count();
  if (count > 0) return;

  for (const name of defaultCategories) {
    const slug = slugify(name);
    await Category.create({ name, slug, isActive: true });
  }
}

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await seedDefaultCategories();
    app.listen(port, () => {
      console.log(`category-service listening on ${port}`);
    });
  } catch (error) {
    console.error("Cannot start category-service:", error);
    process.exit(1);
  }
}

bootstrap();
