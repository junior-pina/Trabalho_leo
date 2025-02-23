const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
require('dotenv').config();

// Database
const db = require('./config/database');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Task = require('./models/Task');
const handlebarsHelpers = require('./helpers/handlebarsHelpers');
const userRoutes = require('./controllers/userController');
const appointmentRoutes = require('./controllers/appointmentController');
const clientRoutes = require('./controllers/clientController');

// Initialize Express
const app = express();

// Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Cookie Parser - Required for CSRF
app.use(cookieParser());

// Session Configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// CSRF Protection - After cookie-parser and session middleware
app.use(csrf({ cookie: true }));

// Add CSRF token to all responses
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

// Make user data available to all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.username = req.session.username;
    res.locals.isAuthenticated = !!req.session.userId;
    next();
});

// Handlebars Configuration
const { formatDate } = require('./helpers/dateHelpers');

app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views/layouts'),
    helpers: {
        formatDate: formatDate,
        eq: handlebarsHelpers.eq,
        getCurrentYear: function() {
            return new Date().getFullYear();
        }
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));
app.set('view engine', 'handlebars');

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/users', userRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/clients', clientRoutes);

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
            console.log(`Server is running on port http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
        process.exit(1);
    });