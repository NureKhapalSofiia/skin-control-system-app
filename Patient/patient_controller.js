const express = require('express');
const {
    getPatientAnalysis,
    getPatientRecommendations,
    getPatientDynamics,
    addPatientFeedback,
    addPatientProduct,
    getProductInfo
} = require('./patient_service');

const PatientRouter = express.Router();

//Перегляд результатів аналізу 
PatientRouter.get('/:id/analysis', async (req, res) => {
    const { id } = req.params;

    try {
        const dynamics = await getPatientAnalysis(id);
        res.json(dynamics);
    } catch (error) {
        console.error('Помилка отримання динаміки стану шкіри:', error);
        res.status(500).json({ message: 'Помилка отримання динаміки стану шкіри' });
    }
});

//Перегляд  рекомендацій від лікаря
PatientRouter.get('/:id/recommendations', async (req, res) => {
    const { id } = req.params;

    try {
        const recommendations = await getPatientRecommendations(id);
        res.json(recommendations);
    } catch (error) {
        console.error('Помилка отримання рекомендацій:', error);
        res.status(500).json({ message: 'Помилка отримання рекомендацій' });
    }
});

//Відстеження динаміки змін у стані шкіри
PatientRouter.get('/:id/dynamics', async (req, res) => {
    const { id } = req.params;
    try {
        const dynamics = await getPatientDynamics(id);
        res.json(dynamics);
    } catch (error) {
        console.error('Помилка отримання динаміки стану шкіри:', error);
        res.status(500).json({ message: 'Помилка отримання динаміки стану шкіри' });
    }
});

// Зворотний зв'язок з лікарем
PatientRouter.post('/:id/feedback', async (req, res) => {
    const { id } = req.params;
    const { doctor_id, rating, content } = req.body;
    
    try {
        await addPatientFeedback(id, doctor_id, rating, content);
        res.status(201).json({ message: 'Зворотний зв’язок успішно надісланий' });
    } catch (error) {
        console.error('Помилка відправки зворотного зв’язку');
        res.status(500).json({ message: 'Помилка відправки зворотного зв’язку' });
    }
});

//Додавання засобів до списку «Використовуються» та фіксація реакцій
PatientRouter.post('/:id/products', async (req, res) => {
    const { id } = req.params; // ID пациента
    const { product_id, reaction, notes, status } = req.body; // Детали продукта

    try {
        await addPatientProduct(id, product_id, reaction, notes, status);
        res.status(201).json({ message: 'Засіб успішно додано до списку «Використовуються»' });
    } catch (error) {
        console.error('Помилка додавання засобу:', error.message);
        res.status(500).json({ message: 'Помилка додавання засобу', error: error.message });
    }
});

// Просмотр информации о продукте по ID
PatientRouter.get('/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const productInfo = await getProductInfo(id);
        res.json({ product: productInfo });
    } catch (error) {
        console.error('Ошибка получения информации о продукте:', error);
        res.status(500).json({ message: 'Не удалось получить информацию о продукте' });
    }
});

module.exports = PatientRouter;