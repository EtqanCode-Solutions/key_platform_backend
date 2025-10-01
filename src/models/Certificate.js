const { DataTypes, Model } = require('sequelize');

class Certificate extends Model {}

module.exports = (sequelize) => {
  Certificate.init({
    id: { type: DataTypes.STRING(40), primaryKey: true },
    student_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    kind: { type: DataTypes.ENUM('course', 'exam'), allowNull: false },
    title: { type: DataTypes.STRING(220), allowNull: false },
    issuedAt: { type: DataTypes.DATEONLY, allowNull: false },
    provider: { type: DataTypes.STRING(120), allowNull: true },
    scorePct: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    grade: { type: DataTypes.STRING(10), allowNull: true },
    hours: { type: DataTypes.DECIMAL(5,1), allowNull: true },
    verifyCode: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    theme: { type: DataTypes.ENUM('classic', 'modern'), defaultValue: 'classic' }
  }, {
    sequelize,
    modelName: 'Certificate',
    tableName: 'certificates'
  });
  return Certificate;
};
