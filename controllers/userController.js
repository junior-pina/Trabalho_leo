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
            return res.render('users/register', { error: 'Username and password are required' });
        }

        if (password.length < 6) {
            return res.render('users/register', { error: 'Password must be at least 6 characters long' });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ where: { username } });
        if (existingUser) {
            return res.render('users/register', { error: 'Username already exists' });
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
        res.render('users/register', { error: 'Registration failed. Please try again.' });
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
            res.redirect('/appointments');
        } else {
            res.render('users/login', { error: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('users/login', { error: 'Login failed. Please try again.' });
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/users/login');
});

module.exports = router;