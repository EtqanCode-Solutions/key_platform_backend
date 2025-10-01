const { DataTypes, Model } = require('sequelize');

class Notification extends Model {}

module.exports = (sequelize) => {
  Notification.init(
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      type: {
        type: DataTypes.ENUM('system', 'course', 'exam', 'payment'),
        allowNull: false,
        defaultValue: 'system',
      },
      title: { type: DataTypes.STRING(200), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      action_link: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      underscored: true,
      timestamps: true, // created_at يُستخدم كـ dateISO في الفرونت
    }
  );

  return Notification;
};
