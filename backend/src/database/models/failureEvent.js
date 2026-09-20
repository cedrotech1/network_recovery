"use strict";

module.exports = (sequelize, DataTypes) => {
  const FailureEvent = sequelize.define(
    "FailureEvent",
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
      failureType: {
        type: DataTypes.STRING(60),
        allowNull: false,
        field: "failure_type",
      },
      scenarioCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: "scenario_code",
      },
      consecutiveFails: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        field: "consecutive_fails",
      },
      injectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "injected_at",
      },
      detectedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "detected_at",
      },
      detectionTimeMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "detection_time_ms",
      },
      isFalsePositive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_false_positive",
      },
      resolvedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "resolved_at",
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "failure_events",
      underscored: true,
      timestamps: true,
    }
  );

  FailureEvent.associate = function associate(models) {
    FailureEvent.belongsTo(models.NetworkNode, { foreignKey: "nodeId", as: "node" });
    FailureEvent.hasMany(models.RecoveryAction, { foreignKey: "failureEventId", as: "recoveries" });
  };

  return FailureEvent;
};
