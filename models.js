const { Sequelize, DataTypes } = require('sequelize');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

// Подключение к базе данных
const dbConfig = new Sequelize('app', 'test_user', 'test1234', {
    host: 'localhost', 
    dialect: 'mssql',
    port: 1433, 
    dialectOptions: {
        options: {
            encrypt: true, 
            trustServerCertificate: true, 
        },
    },
});

const User = dbConfig.define('User', {
    id_user: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: Sequelize.literal('GETDATE()') },
    role: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'User', timestamps: false });

// Определение модели Doctor
const Doctor = dbConfig.define('Doctor', {
    id_doctor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    clinic_name: { type: DataTypes.STRING, allowNull: true },
    rating: { type: DataTypes.FLOAT, allowNull: true },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User, // Устанавливаем связь с моделью User
            key: 'id_user',
        },
    },
}, { tableName: 'Doctor', timestamps: false });

// Определение модели Patient
const Patient = dbConfig.define('Patient', {
    id_patient: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    id_doctor: { type: DataTypes.INTEGER, allowNull: true },
    first_name: { type: DataTypes.STRING, allowNull: true },
    last_name: { type: DataTypes.STRING, allowNull: true },
    birth_date: { type: DataTypes.DATE, allowNull: true },
    gender: { type: DataTypes.STRING, allowNull: true },
    skin_type: { type: DataTypes.STRING, allowNull: true },
    id_user: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'Patients', timestamps: false });

User.hasOne(Patient, { foreignKey: 'id_user', as: 'patient' });
Patient.belongsTo(User, { foreignKey: 'id_user', as: 'user' });

// Определение модели Skin_Analysis
const SkinAnalysis = dbConfig.define('SkinAnalysis', {
    analysis_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    doctor_id: { type: DataTypes.INTEGER, allowNull: true },
    skin_type: { type: DataTypes.STRING, allowNull: false },
    moisture_level: { type: DataTypes.FLOAT, allowNull: false },
    temperature: { type: DataTypes.FLOAT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('GETDATE()') },
}, { tableName: 'Skin_Analysis', timestamps: false });

// Определение модели Used_Products
const UsedProducts = dbConfig.define('UsedProducts', {
    used_product_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Patients', key: 'id_patient' } }
}, { tableName: 'Used_Products', timestamps: false });

Patient.hasMany(UsedProducts, { foreignKey: 'patient_id', as: 'usedProducts' });
UsedProducts.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

// Определение модели Used_Products_item
const UsedProductsItem = dbConfig.define('UsedProductsItem', {
    used_product_item_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    used_product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'UsedProducts', key: 'used_product_id' } },
    product_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Products', key: 'product_id' } },
    started_at: { type: DataTypes.DATE, defaultValue: Sequelize.literal('GETDATE()'), allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'active' },
    reaction: { type: DataTypes.STRING },
    notes: { type: DataTypes.STRING }
}, { tableName: 'Used_Products_Item', timestamps: false });

UsedProducts.hasMany(UsedProductsItem, { foreignKey: 'used_product_id', as: 'items' });
UsedProductsItem.belongsTo(UsedProducts, { foreignKey: 'used_product_id', as: 'list' });

// Определение модели Products
const Products = dbConfig.define('Products', {
    product_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.STRING, allowNull: true },
    using_recommendations: { type: DataTypes.BOOLEAN, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: Sequelize.literal('GETDATE()') },
}, { tableName: 'Products', timestamps: false });

// UsedProductsItem и Products
UsedProductsItem.belongsTo(Products, { foreignKey: 'product_id', as: 'productDetails' });
Products.hasMany(UsedProductsItem, { foreignKey: 'product_id', as: 'items' });

// Определение модели Feedback
const Review = dbConfig.define('Review', {
    review_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    doctor_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Doctor, key: 'id_doctor' } },
    patient_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: Patient, key: 'id_patient' } },
    rating: { type: DataTypes.INTEGER, allowNull: true },
    content: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.DATE, defaultValue: Sequelize.literal('GETDATE()') },
}, {
    tableName: 'Reviews',
    timestamps: false,
    returning: false, // Отключение возврата данных
});

const IoT_Devices = dbConfig.define('IoT_Devices', {
    device_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    serial_number: { type: DataTypes.STRING, allowNull: false, unique: true },
    doctor_id: { 
        type: DataTypes.INTEGER, 
        allowNull: false, 
        references: { model: 'Doctor', key: 'id_doctor' } 
    },
}, { tableName: 'IoT_Devices', timestamps: false });

IoT_Devices.associate = (models) => {
    IoT_Devices.belongsTo(models.Doctor, { foreignKey: 'doctor_id', as: 'doctor' });
};
// Определение модели Appointments
const Appointments = dbConfig.define('Appointments', {
    id_appointment: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Patients', key: 'id_patient' } },
    doctor_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Doctors', key: 'id_doctor' } },
    scheduled_date: { type: DataTypes.DATE, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false }, // 'Scheduled', 'Completed', 'Cancelled'
    notes: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'Appointments', timestamps: false });

// Определение модели RecommendedProducts
const RecommendedProducts = dbConfig.define('RecommendedProducts', {
    recommendation_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patient_id: { type: DataTypes.INTEGER, allowNull: false },
    doctor_id: { type: DataTypes.INTEGER, allowNull: true },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    analysis_id: { type: DataTypes.INTEGER, allowNull: true }, // Поле больше не обязательно
    recommendation_text: { type: DataTypes.TEXT, allowNull: true },
}, {
    tableName: 'Recommended_Products',
    timestamps: false,
});

RecommendedProducts.belongsTo(Products, { foreignKey: 'product_id', as: 'product' });
Products.hasMany(RecommendedProducts, { foreignKey: 'product_id', as: 'recommendations' });

module.exports = {
    dbConfig,
    User,
    Doctor,
    Patient,
    SkinAnalysis,
    UsedProducts,
    UsedProductsItem,
    Products,
    Review,
    Appointments,
    IoT_Devices,
    RecommendedProducts
};