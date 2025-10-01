module.exports = (sequelize) => {
  const { DataTypes } = require("sequelize");
  const ExamAnswer = sequelize.define(
    "ExamAnswer",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      attempt_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      question_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      chosen_key: { type: DataTypes.STRING(2), allowNull: true },
      is_correct: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      correct_key: { type: DataTypes.STRING(2), allowNull: true },
    },
    { tableName: "exam_answers", underscored: true }
  );
  return ExamAnswer;
};
