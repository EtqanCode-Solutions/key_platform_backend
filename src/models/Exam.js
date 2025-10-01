module.exports = (sequelize) => {
  const { DataTypes } = require("sequelize");
  const Exam = sequelize.define(
    "Exam",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      title: { type: DataTypes.STRING(200), allowNull: false },
      type: {
        type: DataTypes.ENUM("quiz", "midterm", "final"),
        allowNull: false,
        defaultValue: "quiz",
      },
      duration_min: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
      difficulty: {
        type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
        allowNull: false,
        defaultValue: "beginner",
      },
      desc: { type: DataTypes.TEXT, allowNull: true },
      published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: "exams", underscored: true }
  );
  return Exam;
};
