const express = require('express');
const { authenticateToken, loginService, logoutService } = require('./login_service');

const AuthRouter = express.Router();

AuthRouter.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Це захищений маршрут', user: req.user });
});

// Роут для входа
AuthRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { token, functionality } = await loginService(email, password);
        res.status(200).json({
            message: functionality.message,
            token,
            actions: functionality.actions,
        });
    } catch (error) {
        console.error('Помилка входу:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// Роут для виходу
AuthRouter.post('/logout', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1]; // Получаем токен из заголовка Authorization

    if (!token) {
        return res.status(401).json({ message: 'Токен відсутній' });
    }

    try {
        const response = await logoutService(token); // Вызываем логику выхода
        res.status(200).json(response);
    } catch (error) {
        console.error('Помилка виходу:', error.message);
        res.status(500).json({ message: error.message });
    }
});

module.exports = AuthRouter;
