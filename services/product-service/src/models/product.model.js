const { DataTypes } = require("sequelize");

function defineProductModel(sequelize) {
  return sequelize.define(
    "Product",
    {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      size: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
      },
      material: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "Khac",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      colors: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
      },
      imageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: "image_url",
      },
      isNew: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_new",
      },
    },
    {
      tableName: "products",
      createdAt: "created_at",
      updatedAt: false,
    }
  );
}

module.exports = { defineProductModel };
