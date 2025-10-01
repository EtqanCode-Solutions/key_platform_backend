const { DataTypes, Model } = require('sequelize');

class Student extends Model {
  toJSON() {
    const v = { ...this.get() };
    delete v.password;
    return v;
  }
}

module.exports = (sequelize) => {
  Student.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: { type: DataTypes.STRING(200), allowNull: false },
    stage: { type: DataTypes.STRING(80), allowNull: true }, // مرحلة/سنة
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'Student',
    tableName: 'students'
  });

  return Student;
};
