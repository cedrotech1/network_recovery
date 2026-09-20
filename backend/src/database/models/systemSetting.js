"use strict";

module.exports = (sequelize, DataTypes) => {
  const SystemSetting = sequelize.define(
    "SystemSetting",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: DataTypes.STRING(80),
        allowNull: false,
        unique: true,
      },
      value: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "system_settings",
      underscored: true,
      timestamps: true,
    }
  );

  return SystemSetting;
};
