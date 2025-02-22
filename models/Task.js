const Sequelize = require('sequelize');
const db = require('../config/database');
const User = require('./User');

const Task = db.define('Task', {
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: Sequelize.TEXT
    }
});

Task.belongsTo(User);

module.exports = Task;