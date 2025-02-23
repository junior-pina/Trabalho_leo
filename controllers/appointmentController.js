const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const moment = require('moment');
const { body, validationResult } = require('express-validator');
const xss = require('xss');

// 🔍 Regras de validação para os agendamentos
const appointmentValidationRules = [
    body('clientName').trim().notEmpty().withMessage('Nome do cliente é obrigatório').escape(),
    body('phone').trim().notEmpty().withMessage('Telefone é obrigatório').escape(),
    body('service').trim().notEmpty().withMessage('Serviço é obrigatório').escape(),
    body('appointmentDate').isDate().withMessage('Data inválida'),
    body('appointmentTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horário inválido'),
    body('status').optional().isIn(['scheduled', 'completed', 'cancelled']).withMessage('Status inválido')
];

// 🎯 Função de tratamento de erros
const handleErrors = (error) => {
    console.error('Erro na operação:', error);
    if (error.name === 'SequelizeValidationError') {
        return 'Dados inválidos. Verifique as informações fornecidas.';
    }
    if (error.name === 'SequelizeDatabaseError') {
        return 'Erro ao processar a operação. Tente novamente.';
    }
    return 'Ocorreu um erro. Tente novamente mais tarde.';
};

// 🔐 Middleware para verificar se o usuário está autenticado
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/users/login');
};

// 📅 Rota para listar todos os agendamentos
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const appointments = await Appointment.findAll({
            where: { ownerId: req.session.userId },
            order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
        });

        const formattedAppointments = appointments.map(appointment => ({
            ...appointment.get(),
            appointmentDate: moment.utc(appointment.appointmentDate).format('DD/MM/YYYY'),
            appointmentTime: appointment.appointmentTime.slice(0, 5),
            status: {
                'scheduled': 'Agendado',
                'completed': 'Concluído',
                'cancelled': 'Cancelado'
            }[appointment.status] || appointment.status
        }));

        res.render('appointments/index', { appointments: formattedAppointments });
    } catch (error) {
        res.status(500).render('error', { error: 'Erro ao buscar agendamentos. Tente novamente mais tarde.' });
    }
});

// 📌 Rota para exibir formulário de novo agendamento
router.get('/new', isAuthenticated, (req, res) => {
    res.render('appointments/new');
});

// ✅ Rota para criar um novo agendamento
router.post('/', isAuthenticated, appointmentValidationRules, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('appointments/new', {
                error: errors.array()[0].msg,
                formData: req.body
            });
        }

        // ✅ Corrigir fuso horário ao salvar a data
        const appointmentDate = moment(req.body.appointmentDate, 'YYYY-MM-DD')
            .startOf('day')
            .format('YYYY-MM-DD');

        await Appointment.create({
            clientName: xss(req.body.clientName),
            phone: xss(req.body.phone),
            service: xss(req.body.service),
            appointmentDate: appointmentDate,
            appointmentTime: req.body.appointmentTime,
            ownerId: req.session.userId
        });

        res.redirect('/appointments');
    } catch (error) {
        res.render('appointments/new', { error: handleErrors(error), formData: req.body });
    }
});

// ✏️ Rota para exibir formulário de edição de um agendamento
router.get('/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            where: { 
                id: req.params.id,
                ownerId: req.session.userId
            }
        });

        if (appointment) {
            const formattedAppointment = {
                ...appointment.get(),
                appointmentDate: moment.utc(appointment.appointmentDate).format('YYYY-MM-DD'),
                appointmentTime: appointment.appointmentTime.slice(0, 5)
            };
            res.render('appointments/edit', { appointment: formattedAppointment });
        } else {
            res.redirect('/appointments');
        }
    } catch (error) {
        res.redirect('/appointments');
    }
});

// ✅ Rota para atualizar um agendamento
router.post('/edit/:id', isAuthenticated, appointmentValidationRules, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('appointments/edit', {
                appointment: req.body,
                error: errors.array()[0].msg
            });
        }

        const appointment = await Appointment.findOne({
            where: { 
                id: req.params.id,
                ownerId: req.session.userId
            }
        });

        if (!appointment) {
            return res.render('appointments/edit', {
                appointment: req.body,
                error: 'Agendamento não encontrado'
            });
        }

        // ✅ Ajustar a data ao atualizar
        const appointmentDate = moment(req.body.appointmentDate, 'YYYY-MM-DD')
            .startOf('day')
            .format('YYYY-MM-DD');

        await appointment.update({
            clientName: xss(req.body.clientName),
            phone: xss(req.body.phone),
            service: xss(req.body.service),
            appointmentDate: appointmentDate,
            appointmentTime: req.body.appointmentTime,
            status: req.body.status
        });

        res.redirect('/appointments');
    } catch (error) {
        res.render('appointments/edit', { appointment: req.body, error: handleErrors(error) });
    }
});

// 🗑️ Rota para deletar um agendamento
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
