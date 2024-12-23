const { IoT_Devices, SkinAnalysis, Doctor, dbConfig } = require('../models'); // Импорт моделей

// Обработка данных с устройства с проверкой закрепленного доктора
const saveSkinAnalysisData = async (serial_number, patient_id, temperature, moisture, skinType) => {
    const device = await IoT_Devices.findOne({ where: { serial_number } });
    if (!device) {
        throw new Error('Пристрій не знайдено');
    }

    if (!device.doctor_id) {
        throw new Error('Доктор не знайдений для цього пристрою');
    }

    if (!patient_id) {
        throw new Error('Необхідно вказати номер пацієнта');
    }

    // Сохраняем данные анализа кожи
    await SkinAnalysis.create({
        patient_id, 
        doctor_id: device.doctor_id, 
        temperature,
        moisture_level: moisture,
        skin_type: skinType,
        created_at:  dbConfig.literal('GETDATE()'), 
    });
};

module.exports = { saveSkinAnalysisData };
