module.exports = (sequelize) => {
  const { DataTypes } = require("sequelize");
  const ExamAttempt = sequelize.define(
    "ExamAttempt",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      student_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      exam_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      correct_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      total_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      score_pct: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      duration_sec: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: { type: DataTypes.ENUM("pass", "fail"), allowNull: false, defaultValue: "fail" },
      taken_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { tableName: "exam_attempts", underscored: true }
  );
  return ExamAttempt;
};
