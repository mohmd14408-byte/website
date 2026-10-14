import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Set required cookie headers for seamless browser/mobile access
app.use((_req, res, next) => {
  res.setHeader(
    'Set-Cookie',
    '__SECURE-aistudio_auth_flow_may_set_cookies=true; Path=/; Secure; SameSite=None; Partitioned; Max-Age=31536000'
  );
  next();
});

// Persistent storage path
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'bookings.json');
const LOGO_FILE = path.join(DATA_DIR, 'logo.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
  schoolName: 'ثانوية الملك عبدالله بن عبدالعزيز',
  roomTitle: 'غرفة مصادر التعلم والابتكار الرقمي',
};

function readSettingsFromFile(): { schoolName: string; roomTitle: string } {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
      return DEFAULT_SETTINGS;
    }
    const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (err) {
    console.error('Error reading settings file:', err);
    return DEFAULT_SETTINGS;
  }
}

function writeSettingsToFile(settings: { schoolName: string; roomTitle: string }) {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing settings file:', err);
  }
}

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readLogoFromFile(): string | null {
  try {
    if (!fs.existsSync(LOGO_FILE)) {
      return null;
    }
    const data = fs.readFileSync(LOGO_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.logoUrl || null;
  } catch (err) {
    console.error('Error reading logo file:', err);
    return null;
  }
}

function writeLogoToFile(logoUrl: string | null) {
  try {
    fs.writeFileSync(LOGO_FILE, JSON.stringify({ logoUrl, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing logo file:', err);
  }
}

function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const INITIAL_SEED_BOOKINGS: any[] = [];

function readBookingsFromFile(): any[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_SEED_BOOKINGS, null, 2), 'utf-8');
      return INITIAL_SEED_BOOKINGS;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading bookings file:', err);
    return INITIAL_SEED_BOOKINGS;
  }
}

function writeBookingsToFile(bookings: any[]) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing bookings file:', err);
  }
}

// Ensure file is seeded on start
readBookingsFromFile();

// API Endpoints
// 1. Get all bookings
app.get('/api/bookings', (_req, res) => {
  const bookings = readBookingsFromFile();
  res.json(bookings);
});

// 2. Create new booking
app.post('/api/bookings', (req, res) => {
  const { studentName, studentEmail, grade, date, timeSlot, purpose, notes } = req.body;

  if (!studentName || !timeSlot || !date) {
    return res.status(400).json({ error: 'بيانات الحجز ناقصة' });
  }

  const bookings = readBookingsFromFile();
  const ticketNumber = `RR-${Math.floor(1000 + Math.random() * 9000)}`;
  const newBooking = {
    id: Date.now(),
    studentName: String(studentName).trim(),
    studentEmail: studentEmail ? String(studentEmail).trim() : '',
    grade: grade || 'عام',
    date: String(date),
    timeSlot: String(timeSlot),
    purpose: purpose ? String(purpose).trim() : 'استخدام غرفة المصادر',
    notes: notes ? String(notes).trim() : undefined,
    createdAt: new Date().toISOString(),
    status: 'confirmed',
    ticketNumber,
  };

  const updated = [newBooking, ...bookings];
  writeBookingsToFile(updated);
  res.status(201).json(newBooking);
});

// 3. Update booking status
app.put('/api/bookings/:id', (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  const bookings = readBookingsFromFile();
  const index = bookings.findIndex((b: any) => String(b.id) === String(id));

  if (index === -1) {
    return res.status(404).json({ error: 'الحجز غير موجود' });
  }

  bookings[index].status = status;
  writeBookingsToFile(bookings);
  res.json(bookings[index]);
});

// 4. Delete booking
app.delete('/api/bookings/:id', (req, res) => {
  const id = req.params.id;
  const bookings = readBookingsFromFile();
  const updated = bookings.filter((b: any) => String(b.id) !== String(id));
  writeBookingsToFile(updated);
  res.json({ success: true });
});

// 5. Reset bookings to seed
app.post('/api/bookings/reset', (_req, res) => {
  writeBookingsToFile(INITIAL_SEED_BOOKINGS);
  res.json({ success: true, bookings: INITIAL_SEED_BOOKINGS });
});

// 6. Logo Management Endpoints
app.get('/api/logo', (_req, res) => {
  const logoUrl = readLogoFromFile();
  res.json({ logoUrl });
});

app.post('/api/logo', (req, res) => {
  const { logoUrl } = req.body;
  if (!logoUrl) {
    return res.status(400).json({ error: 'بيانات الصورة مفقودة' });
  }
  writeLogoToFile(logoUrl);
  res.json({ success: true, logoUrl });
});

app.delete('/api/logo', (_req, res) => {
  writeLogoToFile(null);
  res.json({ success: true, logoUrl: null });
});

// 7. School Settings Endpoints (School Name & Room Title)
app.get('/api/settings', (_req, res) => {
  const settings = readSettingsFromFile();
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const { schoolName, roomTitle } = req.body;
  const current = readSettingsFromFile();
  const updated = {
    schoolName: schoolName !== undefined ? String(schoolName).trim() : current.schoolName,
    roomTitle: roomTitle !== undefined ? String(roomTitle).trim() : current.roomTitle,
  };
  writeSettingsToFile(updated);
  res.json({ success: true, settings: updated });
});

// 8. Favicon serving to prevent 404
app.get('/favicon.ico', (_req, res) => {
  const logoPath = path.resolve(__dirname, 'public/logo.png');
  if (fs.existsSync(logoPath)) {
    res.sendFile(logoPath);
  } else {
    res.status(204).end();
  }
});

// 9. Dedicated Direct Supervisor Entry Routes (redirects cleanly with credentials intact)
app.get(['/supervisor', '/admin', '/schedule', '/dashboard'], (_req, res) => {
  res.redirect('/?role=supervisor#admin');
});

// 10. Dedicated Direct Teacher Entry Routes
app.get(['/teacher', '/book', '/booking'], (_req, res) => {
  res.redirect('/#book');
});

// 11. Standalone System ZIP Download Endpoint
app.get(['/school-sources-system.zip', '/api/download-zip'], (_req, res) => {
  const zipPath = path.resolve(__dirname, 'public/school-sources-system.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'school-sources-system.zip');
  } else {
    res.status(404).send('ZIP file not ready');
  }
});

// 12. Instant Ready-Made Website ZIP (for drag & drop without building)
app.get(['/school-sources-ready-website.zip', '/api/download-ready-website'], (_req, res) => {
  const zipPath = path.resolve(__dirname, 'public/school-sources-ready-website.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'school-sources-ready-website.zip');
  } else {
    res.status(404).send('Ready Website ZIP not ready');
  }
});


// Setup Vite or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Resource Room Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
