import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import Url from './models/Url.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/url_shortener';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Connect to MongoDB with explicit dbName and clearer logs
(async () => {
  try {
    console.log(`[DB] Connecting to Mongo...`);
    await mongoose.connect(MONGO_URI, { dbName: 'urldb' });
    console.log(`[DB] Connected`);
  } catch (err) {
    console.error('[DB] Connection error:', err?.message || err);
    process.exit(1);
  }
})();

// Helper to validate URL
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

// POST /api/shorten – create shortcode for a long URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { longUrl } = req.body;
    if (!longUrl || !isValidUrl(longUrl)) {
      return res.status(400).json({ error: 'Invalid or missing longUrl' });
    }

    // If the URL already exists, return existing shortcode
    const existing = await Url.findOne({ originalUrl: longUrl });
    if (existing) {
      return res.json({
        shortcode: existing.shortcode,
        shortUrl: `${BASE_URL}/${existing.shortcode}`,
        originalUrl: existing.originalUrl,
        clicks: existing.clicks,
      });
    }

    // Generate a unique shortcode
    let shortcode;
    // Limit attempts to avoid infinite loop (rare)
    for (let i = 0; i < 5; i++) {
      const code = nanoid(7);
      const taken = await Url.findOne({ shortcode: code });
      if (!taken) {
        shortcode = code;
        break;
      }
    }
    if (!shortcode) {
      return res.status(500).json({ error: 'Failed to generate shortcode' });
    }

    const doc = await Url.create({ shortcode, originalUrl: longUrl });

    return res.status(201).json({
      shortcode: doc.shortcode,
      shortUrl: `${BASE_URL}/${doc.shortcode}`,
      originalUrl: doc.originalUrl,
      clicks: doc.clicks,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: list all URLs
app.get('/api/admin/urls', async (_req, res) => {
  try {
    const items = await Url.find({}).sort({ createdAt: -1 });
    const data = items.map((i) => ({
      id: i._id,
      shortcode: i.shortcode,
      originalUrl: i.originalUrl,
      shortUrl: `${BASE_URL}/${i.shortcode}`,
      clicks: i.clicks,
      createdAt: i.createdAt,
    }));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Redirect handler
app.get('/:shortcode', async (req, res) => {
  try {
    const { shortcode } = req.params;
    const doc = await Url.findOne({ shortcode });
    if (!doc) return res.status(404).send('Short URL not found');

    doc.clicks += 1;
    await doc.save();

    // Use 302 by default
    return res.redirect(doc.originalUrl);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
