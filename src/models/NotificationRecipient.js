const { DataTypes, Model } = require('sequelize');

class NotificationRecipient extends Model {}

module.exports = (sequelize) => {
  NotificationRecipient.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      notification_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      student_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      read: { type: DataTypes.BOOLEAN, defaultValue: false },
      read_at: { type: DataTypes.DATE, allowNull: true },
      deleted: { type: DataTypes.BOOLEAN, defaultValue: false }, // حذف محلي لطالب معيّن
    },
    {
      sequelize,
      modelName: 'NotificationRecipient',
      tableName: 'notification_recipients',
      underscored: true,
      timestamps: true,
      indexes: [
        { fields: ['student_id', 'read', 'deleted'] },
        { fields: ['notification_id'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return NotificationRecipient;
};
