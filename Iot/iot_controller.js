const express = require('express');
const { saveSkinAnalysisData } = require('./iot_service');

const IoTRouter = express.Router();

// Обработка данных от устройства
IoTRouter.post('/data', async (req, res) => {
    try {
        const { serial_number, patient_id, temperature, moisture, skinType } = req.body;

        if (!serial_number || !patient_id || !temperature || !moisture || !skinType) {
            return res.status(400).json({ message: 'Необхідні дані відсутні' });
        }

        await saveSkinAnalysisData(serial_number, patient_id, temperature, moisture, skinType);

        res.status(200).json({ message: 'Дані успішно збережено' });
    } catch (error) {
        console.error('Помилка збереження даних:', error.message);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = IoTRouter;
