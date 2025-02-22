const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Database
const db = require('./config/database');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Task = require('./models/Task');

// Initialize Express
const app = express();

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Handlebars Configuration
app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));
app.set('view engine', 'handlebars');

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const userRoutes = require('./controllers/userController');
const appointmentRoutes = require('./controllers/appointmentController');

app.use('/users', userRoutes);
app.use('/appointments', appointmentRoutes);

// Preview route
app.get('/preview', (req, res) => {
    res.render('preview', {
        title: 'Preview Page',
        content: 'This is a preview of your application'
    });
});

// Home route
app.get('/', (req, res) => {
    res.render('home');
});

// Database sync and server start
db.authenticate()
    .then(() => {
        console.log('Database connection established successfully.');
        return db.sync();
    })
    .then(() => {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
        process.exit(1);
    });