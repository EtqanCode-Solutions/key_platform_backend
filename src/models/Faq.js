// models/Faq.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Faq = sequelize.define('Faq', {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },

    // نصوص متعددة اللغات
    question_ar: { type: DataTypes.STRING(500), allowNull: false },
    answer_ar:   { type: DataTypes.TEXT,       allowNull: false },
    question_en: { type: DataTypes.STRING(500), allowNull: false },
    answer_en:   { type: DataTypes.TEXT,       allowNull: false },

    // ترتيب العرض + التفعيل
    sort_order: { type: DataTypes.INTEGER,  allowNull: false, defaultValue: 0 },
    is_active:  { type: DataTypes.BOOLEAN,  allowNull: false, defaultValue: true },
  }, {
    tableName: 'faqs',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['is_active'] },
      { fields: ['sort_order'] },
    ],
  });

  return Faq;
};
