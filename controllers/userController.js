const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

router.get('/register', (req, res) => {
    res.render('users/register');
});

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.render('users/register', { error: 'Nome de Usuário e Senha são obrigatórios' });
        }

        if (password.length < 6) {
            return res.render('users/register', { error: 'A senha deve ter pelo menos 6 caracteres' });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.render('users/register', { error: 'O nome de usuário já existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username,
            password: hashedPassword
        });

        req.session.message = 'Registration successful! Please login.';
        res.redirect('/users/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('users/register', { error: 'Falha no registro. Por favor, tente novamente.' });
    }
});

router.get('/login', (req, res) => {
    const message = req.session.message;
    delete req.session.message;
    res.render('users/login', { message });
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });
        
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.redirect('/appointments');
        } else {
            res.render('users/login', { error: 'Nome de usuário ou senha inválidos' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('users/login', { error: 'Falha no login. Por favor, tente novamente.' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/users/login');
});

// Profile editing
router.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }
    User.findByPk(req.session.userId)
        .then(user => {
            res.render('users/profile', { user });
        })
        .catch(error => {
            console.error('Error fetching user profile:', error);
            res.render('error', { error: 'Error fetching user profile' });
        });
});

router.post('/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }

    try {
        const user = await User.findByPk(req.session.userId);
        if (!user) {
            return res.render('error', { error: 'User not found' });
        }

        const { username, currentPassword, newPassword } = req.body;

        // Verify current password
        if (currentPassword && newPassword) {
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.render('users/profile', { user, error: 'Current password is incorrect' });
            }
            // Hash and update new password
            user.password = await bcrypt.hash(newPassword, 10);
        }

        // Update username if provided and different
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ where: { username } });
            if (existingUser) {
                return res.render('users/profile', { user, error: 'Username already exists' });
            }
            user.username = username;
        }

        await user.save();
        req.session.username = user.username;
        res.render('users/profile', { user, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.render('users/profile', { error: 'Error updating profile' });
    }
});

// Account deletion
router.post('/delete', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users/login');
    }

    try {
        await User.destroy({ where: { id: req.session.userId } });
        req.session.destroy();
        res.redirect('/users/login');
    } catch (error) {
        console.error('Error deleting account:', error);
        res.render('error', { error: 'Error deleting account' });
    }
});

module.exports = router;