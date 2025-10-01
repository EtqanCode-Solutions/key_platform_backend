const { DataTypes, Model } = require('sequelize');

class Course extends Model {}

module.exports = (sequelize) => {
  Course.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(180), allowNull: false },
    subtitle: { type: DataTypes.STRING(240), allowNull: true },
    teacher: { type: DataTypes.STRING(120), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    coverUrl: { type: DataTypes.STRING(500), allowNull: true },
    previewUrl: { type: DataTypes.STRING(1000), allowNull: true },
    price: { type: DataTypes.DECIMAL(10,2), allowNull: true },
    original_price: { type: DataTypes.DECIMAL(10,2), allowNull: true },
    is_free: { type: DataTypes.BOOLEAN, defaultValue: false },
    rating: { type: DataTypes.DECIMAL(3,2), defaultValue: 0 },
    review_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    total_duration_sec: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Course',
    tableName: 'courses'
  });
  return Course;
};
