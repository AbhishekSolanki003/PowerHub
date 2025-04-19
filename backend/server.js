const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');


const session = require('express-session');
const app = express();

// Use middleware
const cors = require('cors');
app.use(cors());

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(session({
    secret: 'your-secret-key', // You can change this to a more secure key
    resave: false,
    saveUninitialized: true
}));

// Connect to SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Database opening error:', err);
    } else {
        console.log("Connected to SQLite database");
    }
});

// Create users table if not exists
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT NOT NULL
)`);

// Register route (without password hashing)
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
        [username, email, password],
        function (err) {
            if (err) {
                console.error(err.message);
                res.status(500).json({ error: "Failed to register user" });
            } else {
                res.json({ message: "User registered successfully", userId: this.lastID });
            }
        });
});

// Login route
app.use(express.static(path.join(__dirname, 'public'))); // make sure login.html is in /public



app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Database error');
        }

        if (!row) {
            return res.status(400).send('No user found with that username');
        }

        // Directly compare the stored password with the input password
        if (row.password === password) {
            req.session.userId = row.id;
            req.session.username = row.username;
            return res.json({ message: 'Login successful', userId: row.id });
        } else {
            return res.status(400).send('Incorrect password');
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
