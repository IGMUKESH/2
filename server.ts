import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import ImageKit from 'imagekit';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imagekit = new ImageKit({
  publicKey: process.env.VITE_IMAGEKIT_PUBLIC_KEY || '',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: process.env.VITE_IMAGEKIT_URL_ENDPOINT || '',
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  if (!process.env.VITE_IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.VITE_IMAGEKIT_URL_ENDPOINT) {
    console.warn('WARNING: ImageKit environment variables are missing. Uploads will not work.');
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // ImageKit Authentication Endpoint
  app.get('/api/imagekit/auth', (req, res) => {
    try {
      const result = imagekit.getAuthenticationParameters();
      console.log('ImageKit Auth Success');
      res.json(result);
    } catch (error) {
      console.error('ImageKit Auth Error:', error);
      res.status(500).json({ error: 'Failed to generate auth parameters' });
    }
  });

  // List ImageKit Files
  app.get('/api/imagekit/files', async (req, res) => {
    try {
      const { path = '/', limit = 100, skip = 0 } = req.query;
      const files = await imagekit.listFiles({
        path: path as string,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
      });
      res.json(files);
    } catch (error) {
      console.error('ImageKit List Error:', error);
      res.status(500).json({ error: 'Failed to list files' });
    }
  });

  // Bulk Delete ImageKit Files
  app.post('/api/imagekit/files/bulk-delete', async (req, res) => {
    try {
      const { fileIds } = req.body;
      console.log('Attempting to delete ImageKit files:', fileIds);
      if (!fileIds || !Array.isArray(fileIds)) {
        return res.status(400).json({ error: 'fileIds must be an array' });
      }
      const result = await imagekit.bulkDeleteFiles(fileIds);
      console.log('ImageKit Bulk Delete Result:', result);
      res.json(result);
    } catch (error) {
      console.error('ImageKit Bulk Delete Error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      res.status(500).json({ error: 'Failed to delete files' });
    }
  });

  // Upload Overlay Image
  app.post('/api/imagekit/upload-overlay', async (req, res) => {
    try {
      const { file, fileName } = req.body;
      if (!file) return res.status(400).json({ error: 'No file provided' });
      
      const result = await imagekit.upload({
        file, // base64
        fileName: fileName || `overlay_${Date.now()}.png`,
        folder: 'overlays',
        useUniqueFileName: true,
      });
      res.json(result);
    } catch (error) {
      console.error('ImageKit Upload Overlay Error:', error);
      res.status(500).json({ error: 'Failed to upload overlay' });
    }
  });

  // API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
