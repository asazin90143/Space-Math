require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve static files (index.html, etc.)

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Create Table if not exists
const initDb = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) NOT NULL,
                score INTEGER NOT NULL,
                difficulty VARCHAR(20),
                operations VARCHAR(50),
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Migration: Add operations column if it doesn't exist (for existing databases)
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scores' AND column_name='operations') THEN 
                    ALTER TABLE scores ADD COLUMN operations VARCHAR(50); 
                END IF; 
            END $$;
        `);

        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error initializing database:', err);
    }
};
initDb();

// Routes

// GET Top 10 Scores
app.get('/api/scores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM scores ORDER BY score DESC LIMIT 10');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST New Score
app.post('/api/scores', async (req, res) => {
    const { username, score, difficulty, operations } = req.body;

    // Basic validation
    if (!username || !score) {
        return res.status(400).json({ error: 'Username and score are required' });
    }

    try {
        const opsString = Array.isArray(operations) ? operations.join(',') : (operations || '+');
        const result = await pool.query(
            'INSERT INTO scores (username, score, difficulty, operations) VALUES ($1, $2, $3, $4) RETURNING *',
            [username, score, difficulty || 'medium', opsString]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Fallback to index.html for any other route (SPA style)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
