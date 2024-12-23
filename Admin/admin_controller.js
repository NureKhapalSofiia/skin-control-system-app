const express = require('express');
const {
    addUser,
    assignDoctorToPatient,
    getAnonymousPatientData,
    getStatistics,
    addCareProduct,
    editCareProduct,
    deleteCareProduct,
    getUsedProductsByUsers,
    registerIoTDevice,
} = require('./admin_service');

const AdminRouter = express.Router();

// Додавання нового користувача
AdminRouter.post('/users', async (req, res) => {
    const { email, password, role } = req.body;
    try {
        const user = await addUser(email, password, role);
        res.status(201).json({ message: 'Користувача успішно створено' });
    } catch (error) {
        console.error('Помилка додавання користувача:', error.message);
        res.status(500).json({ message: 'Помилка додавання користувача' });
    }
});

// Призначення лікаря пацієнту
AdminRouter.put('/assign-doctor', async (req, res) => {
    const { patient_id, doctor_id } = req.body;
    try {
        await assignDoctorToPatient(patient_id, doctor_id);
        res.json({ message: 'Лікаря успішно призначено' });
    } catch (error) {
        console.error('Помилка призначення лікаря:', error.message);
        res.status(500).json({ message: 'Помилка призначення лікаря' });
    }
});

// Перегляд анонімізованих даних пацієнтів
AdminRouter.get('/patients/anonymous', async (req, res) => {
    try {
        const data = await getAnonymousPatientData();
        res.json(data);
    } catch (error) {
        console.error('Помилка отримання даних:', error.message);
        res.status(500).json({ message: 'Помилка отримання даних' });
    }
});

// Перегляд статистики
AdminRouter.get('/statistics', async (req, res) => {
    try {
        const stats = await getStatistics();
        res.json(stats);
    } catch (error) {
        console.error('Помилка отримання статистики:', error.message);
        res.status(500).json({ message: 'Помилка отримання статистики' });
    }
});

// Керування базою даних засобів (додавання, редагування, видалення)
AdminRouter.post('/products', async (req, res) => {
    const { name, description, category } = req.body;
    try {
        const product = await addCareProduct({ name, description, category });
        res.status(201).json({ message: 'Засіб успішно додано', product });
    } catch (error) {
        console.error('Помилка додавання засобу:', error.message);
        res.status(500).json({ message: 'Помилка додавання засобу' });
    }
});

AdminRouter.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, category } = req.body;
    try {
        const updatedProduct = await editCareProduct({ id, name, description, category });
        res.json({ message: 'Засіб успішно оновлено', product: updatedProduct });
    } catch (error) {
        console.error('Помилка редагування засобу:', error.message);
        res.status(500).json({ message: 'Помилка редагування засобу' });
    }
});

AdminRouter.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await deleteCareProduct(id);
        res.json({ message: 'Засіб успішно видалено' });
    } catch (error) {
        console.error('Помилка видалення засобу:', error.message);
        res.status(500).json({ message: 'Помилка видалення засобу' });
    }
});

AdminRouter.get('/used-products', async (req, res) => {
    try {
        const usedProducts = await getUsedProductsByUsers();
        res.json(usedProducts);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка получения использованных продуктов' });
    }
});

// Регистрация нового IoT-устройства
AdminRouter.post('/register', async (req, res) => {
    const { serialNumber, doctorId } = req.body;

    try {
        const device = await registerIoTDevice(serialNumber, doctorId);
        res.status(201).json({ message: 'Пристрій успішно зареєстровано', device });
    } catch (error) {
        res.status(500).json({ message: 'Помилка реєстрації пристрою', error: error.message });
    }
});

module.exports = AdminRouter;
