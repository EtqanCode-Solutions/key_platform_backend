const { DataTypes, Model } = require('sequelize');

class LessonProgress extends Model {}

module.exports = (sequelize) => {
  LessonProgress.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    student_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    lesson_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    watchedSec: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false },
    lastWatchedAt: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'LessonProgress',
    tableName: 'lesson_progress',
    indexes: [{ unique: true, fields: ['student_id', 'lesson_id'] }]
  });
  return LessonProgress;
};
