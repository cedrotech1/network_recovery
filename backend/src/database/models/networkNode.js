"use strict";

module.exports = (sequelize, DataTypes) => {
  const NetworkNode = sequelize.define(
    "NetworkNode",
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
      name: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      host: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: "127.0.0.1",
      },
      port: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      healthPath: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: "/health",
        field: "health_path",
      },
      recoverPath: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: "/admin/recover",
        field: "recover_path",
      },
      injectPath: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: "/admin/inject",
        field: "inject_path",
      },
      role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "primary", // primary | standby
      },
      standbyKey: {
        type: DataTypes.STRING(80),
        allowNull: true,
        field: "standby_key",
      },
      recoveryPolicy: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: "restart", // restart | failover
        field: "recovery_policy",
      },
      status: {
        type: DataTypes.STRING(40),
        allowNull: false,
        defaultValue: "unknown", // healthy | degraded | failed | recovering | standby | failed_over
      },
      consecutiveFailures: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "consecutive_failures",
      },
      lastCheckedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_checked_at",
      },
      lastLatencyMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "last_latency_ms",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
      isMonitored: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_monitored",
      },
      failedOverToKey: {
        type: DataTypes.STRING(80),
        allowNull: true,
        field: "failed_over_to_key",
      },
    },
    {
      tableName: "network_nodes",
      underscored: true,
      timestamps: true,
    }
  );

  NetworkNode.associate = function associate(models) {
    NetworkNode.hasMany(models.HealthCheck, { foreignKey: "nodeId", as: "healthChecks" });
    NetworkNode.hasMany(models.FailureEvent, { foreignKey: "nodeId", as: "failures" });
    NetworkNode.hasMany(models.RecoveryAction, { foreignKey: "nodeId", as: "recoveries" });
  };

  return NetworkNode;
};
