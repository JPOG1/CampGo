import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import { authenticate } from '../auth/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const type = (_req.body?.type || 'general') as string;
    const subdir = ['avatar', 'menu', 'vehicle', 'cover', 'logo', 'document', 'general'].includes(type)
      ? type
      : 'general';
    cb(null, path.join(__dirname, '../../uploads', subdir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

export const uploadRouter = Router();

uploadRouter.post('/upload', authenticate, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ detail: 'File too large. Maximum size is 5MB' });
      }
      return res.status(400).json({ detail: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ detail: 'No file provided' });
    }
    const url = `/uploads/${req.body.type || 'general'}/${req.file.filename}`;
    return res.json({ url });
  });
});
