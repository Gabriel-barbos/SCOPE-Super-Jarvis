import express from 'express';
import multer from 'multer';
import RoutineEngine from '../services/RoutineEngine.js';
import RoutineEngineTest from '../services/RoutineEngineTest.js';


const router = express.Router();

const upload = multer({
  dest: 'uploads/',
});

/* =========================
   TESTE (DRY RUN)
========================= */
router.post(
  '/engine-test',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Arquivo não enviado' });
      }

      const result = await RoutineEngineTest.execute({
        filePath: req.file.path,
      });

      return res.json(result);
    } catch (err) {
      console.error('❌ Engine test error:', err);
      return res.status(500).json({ error: err.message });
    }
  }
);

/* =========================
   PRODUÇÃO
========================= */
router.post(
  '/engine',
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Arquivo não enviado' });
      }

      const result = await RoutineEngine.execute({
        filePath: req.file.path,
      });

      return res.json(result);
    } catch (err) {
      console.error('❌ Engine error:', err);
      return res.status(500).json({ error: err.message });
    }
  }
);

export default router;
