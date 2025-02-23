const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const { Op } = require('sequelize');

// Search clients by name
router.get('/search', async (req, res) => {
    try {
        const searchTerm = req.query.term;
        if (!searchTerm) {
            return res.json([]);
        }

        const clients = await Client.findAll({
            where: {
                [Op.or]: [
                    {
                        firstName: {
                            [Op.like]: `%${searchTerm}%`
                        }
                    },
                    {
                        lastName: {
                            [Op.like]: `%${searchTerm}%`
                        }
                    }
                ]
            },
            limit: 10
        });

        res.json(clients);
    } catch (error) {
        console.error('Error searching clients:', error);
        res.status(500).json({ error: 'Error searching clients' });
    }
});

// Create new client
router.post('/', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            address,
            neighborhood,
            city,
            birthDate
        } = req.body;

        const client = await Client.create({
            firstName,
            lastName,
            email,
            phone,
            address,
            neighborhood,
            city,
            birthDate
        });

        res.json(client);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({
            error: 'Error creating client',
            details: error.message
        });
    }
});

module.exports = router;