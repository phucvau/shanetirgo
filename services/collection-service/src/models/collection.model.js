const { DataTypes } = require("sequelize");

function defineCollectionModel(sequelize) {
  return sequelize.define(
    "Collection",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(180),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      imageUrl: {
        type: DataTypes.STRING(2048),
        allowNull: false,
      },
      productIds: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
        field: "product_ids",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      tableName: "collections",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ fields: ["slug"], unique: true }],
    }
  );
}

module.exports = { defineCollectionModel };
