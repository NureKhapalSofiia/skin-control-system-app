const express = require('express');
const { saveSkinAnalysisData } = require('./iot_service');

const IoTRouter = express.Router();

// Дані для визначення типів шкіри
const skinTypeConfig = {
    minDryTemperature: 10,
    maxDryTemperature: 30,
    minOilyMoisture: 60,
    maxOilyMoisture: 80,
    minNormalMoisture: 40,
    maxNormalMoisture: 60,
};

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

IoTRouter.get('/skin-type-config', (req, res) => {
    res.json(skinTypeConfig);
});

module.exports = IoTRouter;
