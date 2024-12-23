
const {User,Doctor,Patient,SkinAnalysis,UsedProducts,UsedProductsItem,Products,Review,Appointments,RecommendedProducts, dbConfig } = require('../models');

// Получение результатов анализа кожи пациента
const getPatientAnalysis = async (patientId) => {
    return await SkinAnalysis.findAll({
        where: { patient_id: patientId },
        order: [['created_at', 'ASC']],
    });
};

// Получение рекомендаций для пациента
const getPatientRecommendations = async (patientId) => {
    return await RecommendedProducts.findAll({
        where: { patient_id: patientId },
        include: [
            { model: Products, as: 'product', attributes: ['product_id', 'name', 'description'] },
        ],
        order: [['priority', 'ASC']],
    });
};

const getPatientDynamics = async (patientId) => {
    try {
        // Используем модель SkinAnalysis для получения данных
        return await SkinAnalysis.findAll({
            where: { patient_id: patientId }, // Фильтр по patient_id
            order: [['created_at', 'ASC']],  // Сортировка по дате создания
        });
    } catch (error) {
        console.error('Помилка отримання динаміки стану шкіри:', error);
        throw error; // Пробрасываем ошибку, чтобы обработать её в контроллере
    }
};

// Добавление обратной связи от пациента
const addPatientFeedback = async (patientId, doctorId, rating, content) => {
    const query = `
        INSERT INTO Reviews (doctor_id, patient_id, rating, content, created_at)
        VALUES (${doctorId}, ${patientId}, ${rating}, '${content}', GETDATE());
    `;
    await dbConfig.query(query);
};

// Добавление продуктов в список "Используемые"
const addPatientProduct = async (patientId, productId, reaction, notes, status = 'active') => {
    const checkPatientSQL = `
        IF NOT EXISTS (SELECT 1 FROM Patients WHERE id_patient = ${patientId})
        BEGIN
            THROW 50000, 'Пацієнт не знайдений', 1;
        END
    `;
    await dbConfig.query(checkPatientSQL);

    const checkProductSQL = `
        IF NOT EXISTS (SELECT 1 FROM Products WHERE product_id = ${productId})
        BEGIN
            THROW 50000, 'Засіб не знайдений', 1;
        END
    `;
    await dbConfig.query(checkProductSQL);

    let usedProductID;
    const getUsedProductSQL = `
        SELECT used_product_id FROM Used_Products WHERE patient_id = ${patientId};
    `;
    const [usedProductResult] = await dbConfig.query(getUsedProductSQL);

    if (usedProductResult.length === 0) {
        const createUsedProductSQL = `
            INSERT INTO Used_Products (patient_id)
            OUTPUT INSERTED.used_product_id
            VALUES (${patientId});
        `;
        const [createdUsedProduct] = await dbConfig.query(createUsedProductSQL);
        usedProductID = createdUsedProduct[0].used_product_id;
    } else {
        usedProductID = usedProductResult[0].used_product_id;
    }

    const insertProductSQL = `
        INSERT INTO Used_Products_Item (used_product_id, product_id, started_at, status, reaction, notes)
        VALUES (${usedProductID}, ${productId}, GETDATE(), '${status}', '${reaction}', '${notes}');
    `;
    await dbConfig.query(insertProductSQL);
};

// Получение информации о продукте по ID
const getProductInfo = async (productId) => {
    try {
        const product = await Products.findByPk(productId, {
            attributes: ['name', 'description', 'using_recommendations'],
        });

        if (!product) {
            throw new Error('Продукт не найден');
        }

        return product;
    } catch (error) {
        console.error('Ошибка получения информации о продукте:', error);
        throw error;
    }
};

module.exports = {
    getPatientAnalysis,
    getPatientRecommendations,
    getPatientDynamics,
    addPatientFeedback,
    addPatientProduct,
    getProductInfo,
};
