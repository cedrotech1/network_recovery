"use strict";

module.exports = (sequelize, DataTypes) => {
  const HealthCheck = sequelize.define(
    "HealthCheck",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      nodeId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "node_id",
      },
      success: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      statusCode: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "status_code",
      },
      latencyMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "latency_ms",
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "error_message",
      },
      checkedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "checked_at",
      },
    },
    {
      tableName: "health_checks",
      underscored: true,
      timestamps: true,
      updatedAt: false,
    }
  );

  HealthCheck.associate = function associate(models) {
    HealthCheck.belongsTo(models.NetworkNode, { foreignKey: "nodeId", as: "node" });
  };

  return HealthCheck;
};
