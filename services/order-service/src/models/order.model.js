const { DataTypes } = require("sequelize");

function defineOrderModel(sequelize) {
  return sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      orderCode: {
        type: DataTypes.STRING(40),
        allowNull: true,
        unique: true,
        field: "order_code",
      },
      customerName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "customer_name",
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      district: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ward: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      street: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      addressLine: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "address_line",
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      items: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      itemCount: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
        field: "item_count",
      },
      totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        field: "total_amount",
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      tableName: "orders",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}

module.exports = { defineOrderModel };
