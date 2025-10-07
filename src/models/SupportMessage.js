const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SupportMessage = sequelize.define('SupportMessage', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    ticket_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'support_tickets', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    sender_type: { type: DataTypes.ENUM('student', 'staff'), allowNull: false },
    sender_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      // مفيش FK هنا لأن sender_id يشير إما لطالب أو لموظف حسب sender_type.
      // لو عايز FK مشروط هتحتاج تصميم polymorphic مختلف.
    },
    body: { type: DataTypes.TEXT, allowNull: false },
  }, {
    tableName: 'support_messages',
    underscored: true,
    timestamps: true,
  });

  return SupportMessage;
};
