const express = require('express');
const {
    getPatientsByDoctor,
    getAnalysisTrends,
    createRecommendation,
    getPatientProduct,
} = require('./doctor_service');

const DoctorRouter = express.Router();

// Получение данных о пациентах доктора
DoctorRouter.get('/:id/patients', async (req, res) => {
    const { id } = req.params; // ID доктора
    try {
        const patients = await getPatientsByDoctor(id);
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Помилка отримання пацієнтів' });
    }
});

// Получение тенденций анализа состояния кожи
DoctorRouter.get('/:id/analysis-trends', async (req, res) => {
    const { id } = req.params;
    try {
        const trends = await getAnalysisTrends(id);
        res.json(trends);
    } catch (error) {
        res.status(500).json({ message: 'Помилка отримання тенденцій' });
    }
});

// Создание персонализированных рекомендаций
DoctorRouter.post('/:id/recommendations', async (req, res) => {
    const { id } = req.params; // ID доктора
    const { patient_id, recommendations, product_id, analysis_id } = req.body;

    // Проверка наличия всех необходимых полей
    if (!patient_id || !recommendations || !product_id || !analysis_id) {
        return res.status(400).json({ message: 'Необхідно вказати всі поля: patient_id, recommendations, product_id, analysis_id' });
    }

    try {
        await createRecommendation(id, patient_id, recommendations, product_id, analysis_id);
        res.status(201).json({ message: 'Рекомендації успішно створено' });
    } catch (error) {
        console.error('Помилка створення рекомендацій:', error);
        res.status(500).json({ message: 'Помилка створення рекомендацій', error: error.message });
    }
});

// Управление средствами пациента
DoctorRouter.get('/:id/patient-products/:product_id', async (req, res) => {
    const { id, product_id } = req.params;
    const { patient_id } = req.query; // Получаем patient_id из запроса

    console.log(`Запрос: doctor_id=${id}, patient_id=${patient_id}, product_id=${product_id}`);

    try {
        const productItem = await getPatientProduct(patient_id, product_id);

        res.json({ product: productItem });
    } catch (error) {
        console.error('Ошибка:', error.message);
        res.status(500).json({ message: 'Помилка отримання даних про засіб' });
    }
});


module.exports = DoctorRouter;
