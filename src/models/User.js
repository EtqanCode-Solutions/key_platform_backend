const { DataTypes, Model } = require('sequelize');

class User extends Model {
  toJSON() {
    const v = { ...this.get() };
    delete v.password;
    return v;
  }
}

module.exports = (sequelize) => {
  User.init({
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: { type: DataTypes.STRING(200), allowNull: false },
    role: { type: DataTypes.ENUM('ADMIN', 'USER'), allowNull: false, defaultValue: 'USER' },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users'
  });

  return User;
};
