"use strict";

module.exports = (sequelize, DataTypes) => {
  const RecoveryAction = sequelize.define(
    "RecoveryAction",
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
      failureEventId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "failure_event_id",
      },
      actionType: {
        type: DataTypes.STRING(40),
        allowNull: false,
        field: "action_type", // restart | failover | none
      },
      success: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "started_at",
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "completed_at",
      },
      durationMs: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "duration_ms",
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      targetNodeKey: {
        type: DataTypes.STRING(80),
        allowNull: true,
        field: "target_node_key",
      },
    },
    {
      tableName: "recovery_actions",
      underscored: true,
      timestamps: true,
    }
  );

  RecoveryAction.associate = function associate(models) {
    RecoveryAction.belongsTo(models.NetworkNode, { foreignKey: "nodeId", as: "node" });
    RecoveryAction.belongsTo(models.FailureEvent, { foreignKey: "failureEventId", as: "failure" });
  };

  return RecoveryAction;
};
