const Sequelize = require('sequelize');
const db = require('../config/database');
const User = require('./User');

const Appointment = db.define('Appointment', {
    clientName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    phone: {
        type: Sequelize.STRING,
        allowNull: false
    },
    service: {
        type: Sequelize.STRING,
        allowNull: false
    },
    appointmentDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    appointmentTime: {
        type: Sequelize.TIME,
        allowNull: false
    },
    status: {
        type: Sequelize.ENUM('scheduled', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    }
});

Appointment.belongsTo(User, {
    foreignKey: 'ownerId',
    as: 'owner'
});

module.exports = Appointment;