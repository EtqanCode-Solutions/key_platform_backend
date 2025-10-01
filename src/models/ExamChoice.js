module.exports = (sequelize) => {
  const { DataTypes } = require("sequelize");
  const ExamChoice = sequelize.define(
    "ExamChoice",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      question_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      key: { type: DataTypes.STRING(2), allowNull: false },
      text: { type: DataTypes.TEXT, allowNull: false },
      is_correct: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: "exam_choices", underscored: true }
  );
  return ExamChoice;
};
