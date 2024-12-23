const { Patient, SkinAnalysis, RecommendedProducts, UsedProducts, Products, UsedProductsItem, dbConfig} = require('../models');

// Получение данных о пациентах доктора
const getPatientsByDoctor = async (doctorId) => {
    try {
        return await Patient.findAll({
            where: { id_doctor: doctorId },
            attributes: ['id_patient', 'first_name', 'last_name', 'birth_date', 'gender', 'skin_type', 'id_user'],
        });
    } catch (error) {
        console.error('Помилка отримання пацієнтів:', error);
        throw error;
    }
};

// Получение тенденций анализа состояния кожи
const getAnalysisTrends = async (doctorId) => {
    try {
        return await SkinAnalysis.findAll({
            where: { doctor_id: doctorId },
            order: [['created_at', 'ASC']],
        });
    } catch (error) {
        console.error('Помилка отримання тенденцій:', error);
        throw error;
    }
};

// Создание персонализированных рекомендаций
const createRecommendation = async (doctorId, patientId, recommendations, productId, analysisId) => {
    try {
        return await RecommendedProducts.create({
            doctor_id: doctorId,
            patient_id: patientId,
            recommendation_text: recommendations,
            product_id: productId,
            analysis_id: analysisId, // Указываем analysis_id
        });
    } catch (error) {
        console.error('Помилка створення рекомендацій:', error);
        throw error;
    }
};

// Управление средствами пациента
const getPatientProduct = async (patientId, productId) => {
    try {
        // Выполнение "сырого" SQL-запроса
        const [results] = await dbConfig.query(`
            SELECT 
                upi.used_product_item_id, 
                upi.product_id, 
                upi.started_at, 
                upi.status, 
                upi.reaction, 
                upi.notes 
            FROM Used_Products_Item upi
            INNER JOIN Used_Products up ON up.used_product_id = upi.used_product_id
            WHERE up.patient_id = :patientId AND upi.product_id = :productId
        `, {
            replacements: { patientId, productId }, // Замена параметров для защиты от SQL-инъекций
        });

        if (!results || results.length === 0) {
            return null; // Если записи не найдены
        }

        return results[0]; // Возвращаем первую найденную запись
    } catch (error) {
        console.error('Ошибка выполнения запроса:', error.message);
        throw error;
    }
};

module.exports = {
    getPatientsByDoctor,
    getAnalysisTrends,
    createRecommendation,
    getPatientProduct,
};
