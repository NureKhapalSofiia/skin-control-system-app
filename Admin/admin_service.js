const { User, Patient, Doctor, Products, UsedProducts, UsedProductsItem, dbConfig } = require('../models');
const bcrypt = require('bcrypt');

// Додавання нового користувача
const addUser = async (email, password, role) => {
    // Проверяем формат email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Некоректний формат email');
    }

    // Проверяем уникальность email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        throw new Error('Користувач з таким email вже існує');
    }

    // Хэшируем пароль и создаем пользователя
    const hashedPassword = await bcrypt.hash(password, 10);
    return await User.create({ email, password: hashedPassword, role });
};


// Призначення лікаря пацієнту
const assignDoctorToPatient = async (patientId, doctorId) => {
    const patient = await Patient.findByPk(patientId); // Исправлено имя модели
    if (!patient) {
        throw new Error('Пацієнта не знайдено');
    }
    patient.id_doctor = doctorId;
    await patient.save();
};

// Перегляд анонімізованих даних пацієнтів
const getAnonymousPatientData = async () => {
    return await Patient.findAll({
        attributes: ['id_patient', 'gender', 'birth_date', 'skin_type'],
    });
};

// Перегляд статистики
const getStatistics = async () => {
    try {
        // Считаем общее количество пациентов
        const [totalPatientCount] = await dbConfig.query(
            'SELECT COUNT(*) as count FROM Patients'
        );

        // Считаем количество пациентов для каждого врача
        const [patientsPerDoctor] = await dbConfig.query(
            `SELECT id_doctor, COUNT(*) as patient_count 
             FROM Patients 
             WHERE id_doctor IS NOT NULL 
             GROUP BY id_doctor`
        );

        // Получаем рейтинг каждого врача
        const [doctorRatings] = await dbConfig.query(
            'SELECT id_doctor, rating FROM Doctor'
        );

        return {
            totalPatientCount: totalPatientCount[0].count,
            patientsPerDoctor,
            doctorRatings,
        };
    } catch (error) {
        console.error('Помилка отримання статистики:', error);
        throw new Error('Не вдалося отримати статистику');
    }
};

// Керування базою даних засобів
const addCareProduct = async (productData) => {
    const newProduct = await Products.create(productData);

    if (productData.category.toLowerCase() === 'soap') {
        const patients = await Patient.findAll(); 
        for (const patient of patients) {
            let usedProduct = await UsedProducts.findOne({
                where: { patient_id: patient.id_patient },
            });

            if (!usedProduct) {
                usedProduct = await UsedProducts.create({ patient_id: patient.id_patient });
            }

            await UsedProductsItem.create({
                used_product_id: usedProduct.used_product_id,
                product_id: newProduct.product_id,
                started_at: dbConfig.literal('GETDATE()'),
                status: 'active',
            });
        }
    }

    return newProduct;
};

const editCareProduct = async (productData) => {
    const product = await Products.findByPk(productData.id);
    if (!product) {
        throw new Error('Засіб не знайдено');
    }
    product.name = productData.name;
    product.description = productData.description;
    product.category = productData.category;
    await product.save();
    return product;
};

const deleteCareProduct = async (productId) => {
    const product = await Products.findByPk(productId);
    if (!product) {
        throw new Error('Засіб не знайдено');
    }

    await Products.destroy({ where: { product_id: productId } });
};


const getUsedProductsByUsers = async () => {
    try {
        const users = await User.findAll({
            include: {
                model: Patient,
                as: 'patient',
                include: {
                    model: UsedProducts,
                    as: 'usedProducts',
                    include: {
                        model: UsedProductsItem,
                        as: 'items',
                        include: {
                            model: Products,
                            as: 'productDetails',
                            attributes: ['name', 'description', 'using_recommendations'],
                        },
                    },
                },
            },
        });

        return users.map(user => ({
            userId: user.id_user,
            email: user.email,
            usedProducts: user.patient?.usedProducts?.map(product => ({
                id: product.id,
                items: product.items?.map(item => ({
                    productName: item.productDetails?.name,
                    description: item.productDetails?.description,
                    usingRecommendations: item.productDetails?.using_recommendations,
                })),
            })),
        }));
    } catch (error) {
        console.error('Ошибка получения использованных продуктов:', error);
        throw error;
    }
};

// Регистрация нового IoT-устройства
const registerIoTDevice = async (serialNumber, doctorId) => {
    try {
        // Проверяем существование доктора
        const doctor = await Doctor.findByPk(doctorId);
        if (!doctor) {
            throw new Error('Доктора не знайдено');
        }

        // Создаем запись об устройстве
        const device = await IoT_Devices.create({
            serial_number: serialNumber,
            doctor_id: doctorId,
        });

        console.log('IoT пристрій зареєстровано:', device);
        return device;
    } catch (error) {
        console.error('Помилка реєстрації IoT пристрою:', error.message);
        throw error;
    }
};

module.exports = {
    addUser,
    assignDoctorToPatient,
    getAnonymousPatientData,
    getStatistics,
    addCareProduct,
    editCareProduct,
    deleteCareProduct,
    getUsedProductsByUsers,
    registerIoTDevice,
};
