const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const adminRoutes = require('./routes/admin');
const timetableRoutes = require('./routes/timetable');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (HTML, CSS, JS)
app.use(
    session({
        secret: 'your-secret-key', // Replace with a secure key
        resave: false,
        saveUninitialized: true,
    })
);

// Fake user database for login
const users = [
    { username: 'faculty', password: 'password123' },
    { username: 'student', password: 'password123' },
];

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username && u.password === password);

    if (user) {
        req.session.user = user; // Save user in session
        res.status(200).send('Login successful');
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Middleware to protect faculty/student routes
app.use((req, res, next) => {
    const protectedRoutes = ['/faculty-student-timetables.html'];
    if (protectedRoutes.includes(req.path) && !req.session.user) {
        return res.redirect('/faculty-student.html'); // Redirect to login page
    }
    next();
});

// Routes
app.use('/admin', adminRoutes);
app.use('/timetable', timetableRoutes);

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});