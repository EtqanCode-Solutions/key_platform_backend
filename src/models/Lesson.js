const { DataTypes, Model } = require('sequelize');

class Lesson extends Model {}

module.exports = (sequelize) => {
  Lesson.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    order: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    videoUrl: { type: DataTypes.STRING(1000), allowNull: true },
    durationSec: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0 },
    is_free: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Lesson',
    tableName: 'lessons'
  });
  return Lesson;
};
