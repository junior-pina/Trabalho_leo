const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/users/login');
};

// Get all appointments
router.get('/', isAuthenticated, async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).render('error', { error: 'Authentication required' });
        }

        const appointments = await Appointment.findAll({
            where: { ownerId: req.session.userId },
            order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
        });

        const formattedAppointments = appointments.map(appointment => {
            const status = {
                'scheduled': 'Agendado',
                'completed': 'Concluído',
                'cancelled': 'Cancelado'
            }[appointment.status] || appointment.status;

            return {
                ...appointment.get(),
                appointmentDate: new Date(appointment.appointmentDate).toLocaleDateString('pt-BR'),
                appointmentTime: appointment.appointmentTime.slice(0, 5),
                status: status
            };
        });

        res.render('appointments/index', { appointments: formattedAppointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).render('error', { error: 'An error occurred while fetching appointments. Please try again later.' });
    }
});

// Show appointment creation form
router.get('/new', isAuthenticated, (req, res) => {
    res.render('appointments/new');
});

// Create new appointment
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const appointment = await Appointment.create({
            clientName: req.body.clientName,
            phone: req.body.phone,
            service: req.body.service,
            appointmentDate: req.body.appointmentDate,
            appointmentTime: req.body.appointmentTime,
            ownerId: req.session.userId
        });
        res.redirect('/appointments');
    } catch (error) {
        res.render('appointments/new', { error: 'Error creating appointment' });
    }
});

// Show edit form
router.get('/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            where: { 
                id: req.params.id,
                ownerId: req.session.userId
            }
        });
        if (appointment) {
            res.render('appointments/edit', { appointment });
        } else {
            res.redirect('/appointments');
        }
    } catch (error) {
        res.redirect('/appointments');
    }
});

// Update appointment
router.post('/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            where: { 
                id: req.params.id,
                ownerId: req.session.userId
            }
        });
        if (appointment) {
            await appointment.update({
                clientName: req.body.clientName,
                phone: req.body.phone,
                service: req.body.service,
                appointmentDate: req.body.appointmentDate,
                appointmentTime: req.body.appointmentTime,
                status: req.body.status
            });
        }
        res.redirect('/appointments');
    } catch (error) {
        res.render('appointments/edit', { 
            appointment: req.body,
            error: 'Error updating appointment'
        });
    }
});

// Delete appointment
router.post('/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await Appointment.destroy({
            where: { 
                id: req.params.id,
                ownerId: req.session.userId
            }
        });
        res.redirect('/appointments');
    } catch (error) {
        res.redirect('/appointments');
    }
});

module.exports = router;