const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/users/login');
    }
};

// Get all tasks
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const tasks = await Task.findAll({
            where: { userId: req.session.userId }
        });
        res.render('tasks/index', { tasks });
    } catch (error) {
        res.status(500).render('error', { message: 'Error fetching tasks' });
    }
});

// Create new task
router.post('/', isAuthenticated, async (req, res) => {
    try {
        await Task.create({
            title: req.body.title,
            description: req.body.description,
            userId: req.session.userId
        });
        res.redirect('/tasks');
    } catch (error) {
        res.status(500).render('error', { message: 'Error creating task' });
    }
});

module.exports = router;