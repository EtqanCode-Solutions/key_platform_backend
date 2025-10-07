const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SupportTicket = sequelize.define('SupportTicket', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    student_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'students', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    topic: {
      type: DataTypes.ENUM('general', 'billing', 'technical'),
      allowNull: false,
      defaultValue: 'general',
    },
    subject: { type: DataTypes.STRING(200), allowNull: false },
    status: {
      type: DataTypes.ENUM('open', 'pending', 'resolved', 'closed'),
      allowNull: false,
      defaultValue: 'open',
    },
    assigned_to: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    last_activity_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    is_archived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, {
    tableName: 'support_tickets',
    underscored: true,
    timestamps: true,
  });

  return SupportTicket;
};
