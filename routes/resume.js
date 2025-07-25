import express from 'express';
import multer from 'multer';
import pkg from 'pg';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
});

// Upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// POST: Upload resume
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    console.log('📥 Resume POST request received.');

    const { name, email, position } = req.body;
    const fileName = req.file?.filename;

    if (!name || !email || !position || !fileName) {
      console.log('⚠️ Missing fields:', { name, email, position, fileName });
      return res.status(400).json({ error: 'All fields including file are required.' });
    }

    const query = `
      INSERT INTO resumes (name, email, position, file_name)
      VALUES ($1, $2, $3, $4)
    `;

    await pool.query(query, [name, email, position, fileName]);

    console.log('✅ Resume uploaded and saved to DB:', { name, email, position, fileName });

    res.status(200).json({ message: 'Resume submitted successfully!' });

  } catch (err) {
    console.error('❌ Error in POST /resume:', err);
    res.status(500).json({ error: 'Failed to submit resume. Please try again.' });
  }
});

export default router;
