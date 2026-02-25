const { DataTypes } = require("sequelize");

function defineAdminUserModel(sequelize) {
  return sequelize.define(
    "AdminUser",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(190),
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "password_hash",
      },
      resetTokenHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "reset_token_hash",
      },
      resetTokenExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "reset_token_expires_at",
      },
    },
    {
      tableName: "admin_users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}

module.exports = { defineAdminUserModel };
