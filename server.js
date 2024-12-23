const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs'); 

// Регистрация маршрутов
const patientController = require('./Patient/patient_controller');
const doctorController = require('./Doctor/doctor_controller');
const adminController = require('./Admin/admin_controller');
const loginController = require('./Login/login_controller');
const oitController = require('./Iot/iot_controller');



const app = express();
const PORT = process.env.PORT || 3001;

// Підключення до БД через Sequelize
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

// Включаємо CORS для доступу до API
app.use(cors());
app.use(express.json());


(async () => {
    try {
        await dbConfig.authenticate(); // Перевірка підключення
        console.log('Підключення до бази даних успішне!');
    } catch (error) {
        console.error('Помилка підключення до бази даних:', error);
        process.exit(1); // Завершити процес у разі помилки підключення
    }
})();

app.use('/api/patients', patientController); // Все маршруты пациентов
app.use('/api/doctors', doctorController);  // Все маршруты докторов
app.use('/api/admin', adminController);    // Все маршруты админов
app.use('/api/login', loginController);    // Все маршруты админов
app.use('/api/iot', oitController);    // Все маршруты админов


app.listen(PORT, () => {
    console.log(`Сервер работает на порту ${PORT}`);
});

