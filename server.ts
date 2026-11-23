import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { MAX_UPLOAD_SIZE_BYTES, validateFileUpload } from './src/utils/validation';

const ADMIN_EMAIL = 'feri.smkn4madiun@gmail.com';
const STORAGE_ROOT = path.resolve(process.cwd(), 'storage');
const UPLOADS_DIR = path.resolve(STORAGE_ROOT, 'uploads');
const PUBLIC_ASSETS_FILE = path.resolve(STORAGE_ROOT, 'public-assets.json');
const STAFF_REGISTRY_FILE = path.resolve(STORAGE_ROOT, 'staff-registry.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function readJsonSet(filePath: string, initialItems: string[] = []): Set<string> {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(initialItems, null, 2), 'utf8');
      return new Set(initialItems);
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((item): item is string => typeof item === 'string'));
    }
  } catch (err) {
    console.error('Error reading JSON set:', filePath, err);
  }
  return new Set(initialItems);
}

function writeJsonSet(filePath: string, set: Set<string>): void {
  fs.writeFileSync(filePath, JSON.stringify(Array.from(set), null, 2), 'utf8');
}

const publicAssets = readJsonSet(PUBLIC_ASSETS_FILE, []);
const staffRegistry = readJsonSet(STAFF_REGISTRY_FILE, [ADMIN_EMAIL]);

function initFirebaseAdminAuth() {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return null;
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { projectId?: string };
    if (!raw.projectId || raw.projectId === 'remixed-project-id') return null;
    const app = getApps().length
      ? getApp()
      : initializeApp({ projectId: raw.projectId });
    return getAuth(app);
  } catch (err) {
    console.error('Firebase Admin Auth initialization failed:', err);
    return null;
  }
}

const adminAuth = initFirebaseAdminAuth();

async function verifyStaffRequest(req: express.Request): Promise<{ email: string; uid: string } | null> {
  if (!adminAuth) return null;
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (decoded.email ?? '').toLowerCase();
    if (!decoded.email_verified || !email) return null;
    if (email === ADMIN_EMAIL || staffRegistry.has(email)) {
      return { email, uid: decoded.uid };
    }
    return null;
  } catch {
    return null;
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const validation = validateFileUpload(file.originalname, file.mimetype, 1);
    const ext = validation.extension || '';
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const validation = validateFileUpload(file.originalname, file.mimetype, 1);
    if (!validation.valid) {
      cb(new Error(validation.error || 'Format file tidak diizinkan.'));
      return;
    }
    cb(null, true);
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/upload', (req, res) => {
    upload.single('file')(req, res, async (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Gagal mengunggah file.';
        res.status(400).json({ error: message });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'Tidak ada file yang dikirim.' });
        return;
      }

      const sizeCheck = validateFileUpload(
        req.file.originalname,
        req.file.mimetype,
        req.file.size
      );
      if (!sizeCheck.valid) {
        fs.unlink(req.file.path, () => {});
        res.status(400).json({ error: sizeCheck.error });
        return;
      }

      // Optional gallery cover upload directly by verified staff
      if (req.query.scope === 'gallery') {
        const staff = await verifyStaffRequest(req);
        if (!staff) {
          fs.unlink(req.file.path, () => {});
          res.status(403).json({ error: 'Hanya guru atau admin terverifikasi yang dapat mengunggah cover galeri.' });
          return;
        }
        publicAssets.add(req.file.filename);
        writeJsonSet(PUBLIC_ASSETS_FILE, publicAssets);
      }

      res.json({
        storedName: req.file.filename,
        fileUrl: `/api/files/${req.file.filename}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });
    });
  });

  app.post('/api/gallery-assets/publish', async (req, res) => {
    const staff = await verifyStaffRequest(req);
    if (!staff) {
      res.status(403).json({ error: 'Akses ditolak. Memerlukan otorisasi guru atau admin.' });
      return;
    }
    const rawUrl = typeof req.body?.fileUrl === 'string' ? req.body.fileUrl.trim() : '';
    const match = rawUrl.match(/^\/api\/files\/([a-zA-Z0-9._-]+)$/);
    if (!match) {
      res.json({ ok: true, skipped: true });
      return;
    }
    const storedName = match[1];
    publicAssets.add(storedName);
    writeJsonSet(PUBLIC_ASSETS_FILE, publicAssets);
    res.json({ ok: true, storedName });
  });

  app.post('/api/staff-sync', async (req, res) => {
    const staff = await verifyStaffRequest(req);
    if (!staff || staff.email !== ADMIN_EMAIL) {
      res.status(403).json({ error: 'Hanya admin utama yang dapat menyinkronkan daftar staf.' });
      return;
    }
    const emails = Array.isArray(req.body?.emails) ? req.body.emails : [];
    const nextSet = new Set<string>([ADMIN_EMAIL]);
    for (const item of emails) {
      if (typeof item === 'string' && item.includes('@')) {
        nextSet.add(item.trim().toLowerCase());
      }
    }
    staffRegistry.clear();
    for (const e of nextSet) staffRegistry.add(e);
    writeJsonSet(STAFF_REGISTRY_FILE, staffRegistry);
    res.json({ ok: true, count: staffRegistry.size });
  });

  app.get('/api/files/:storedName', async (req, res) => {
    const { storedName } = req.params;
    if (!/^[a-zA-Z0-9._-]+$/.test(storedName)) {
      res.status(400).json({ error: 'Nama file tidak valid.' });
      return;
    }

    const isPublicAsset = publicAssets.has(storedName);
    if (!isPublicAsset) {
      const staff = await verifyStaffRequest(req);
      if (!staff) {
        res.status(403).json({ error: 'File tugas siswa bersifat privat. Masuk sebagai guru atau admin untuk mengakses.' });
        return;
      }
    }

    const resolvedPath = path.resolve(UPLOADS_DIR, storedName);
    if (!resolvedPath.startsWith(UPLOADS_DIR + path.sep) || !fs.existsSync(resolvedPath)) {
      res.status(404).json({ error: 'File tidak ditemukan.' });
      return;
    }

    if (req.query.download === '1') {
      const requestedName = typeof req.query.name === 'string' && req.query.name.trim()
        ? req.query.name.replace(/[^a-zA-Z0-9._ -]/g, '_')
        : storedName;
      res.download(resolvedPath, requestedName);
      return;
    }

    res.sendFile(resolvedPath);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
