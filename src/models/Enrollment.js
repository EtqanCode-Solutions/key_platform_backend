const { DataTypes, Model } = require('sequelize');

class Enrollment extends Model {}

module.exports = (sequelize) => {
  Enrollment.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    student_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    course_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    status: { type: DataTypes.ENUM('active', 'expired', 'canceled'), defaultValue: 'active' },
    started_at: { type: DataTypes.DATE, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Enrollment',
    tableName: 'enrollments',
    indexes: [{ unique: true, fields: ['student_id', 'course_id'] }]
  });
  return Enrollment;
};
