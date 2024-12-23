const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const SECRET_KEY = 'your_secret_key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Извлекаем токен

    if (!token) {
        return res.status(401).json({ message: 'Токен відсутній' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Недійсний токен' });
        }
        req.user = user; // Сохраняем данные пользователя из токена
        next();
    });
};

const loginService = async (email, password) => {
    // Поиск пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error('Користувача не знайдено');
    }

    // Проверка пароля
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Неправильний пароль');
    }

    // Генерация токена
    const token = jwt.sign({ id: user.id_user, role: user.role }, SECRET_KEY, { expiresIn: '2h' });

    // Функционал в зависимости от роли
    let functionality;
    switch (user.role) {
        case 0: // Пациент
            functionality = {
                message: 'Ласкаво просимо, пацієнте!',
                actions: [
                    'Перегляд аналізів',
                    'Перегляд рекомендованих засобів',
                    'Надання відгуків',
                ],
            };
            break;
        case 1: // Доктор
            functionality = {
                message: 'Ласкаво просимо, лікарю!',
                actions: [
                    'Перегляд пацієнтів',
                    'Відстеження змін стану шкіри',
                    'Створення рекомендацій',
                ],
            };
            break;
        default:
            throw new Error('Роль користувача не підтримується');
    }

    return { token, functionality };
};

const logoutService = async (token) => {
    try {
        // Тут можно реализовать логику добавления токена в "чёрный список"
        // либо обновить состояние в БД (например, добавить статус "logged_out").

        return { message: 'Вихід виконано успішно' };
    } catch (error) {
        console.error('Помилка виходу:', error);
        throw new Error('Не вдалося виконати вихід');
    }
};

module.exports = { authenticateToken, loginService, logoutService };
