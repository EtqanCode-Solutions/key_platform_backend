module.exports = (sequelize) => {
  const { DataTypes } = require("sequelize");
  const ExamQuestion = sequelize.define(
    "ExamQuestion",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      exam_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      text: { type: DataTypes.TEXT, allowNull: false },
      order_index: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      explanation: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "exam_questions", underscored: true }
  );
  return ExamQuestion;
};
