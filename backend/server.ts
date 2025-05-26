import express, { Request, Response} from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { dbOperations } from './db';
import type { S3File } from './s3';
import { upload } from './s3';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
// const rootUploadsPath = path.join(__dirname, '../uploads');
// app.use('/uploads', express.static(rootUploadsPath));
// console.log('Serving from:', rootUploadsPath);




// GET all spare parts
app.get('/api/spare-parts', async (req, res): Promise<void> => {
  try {
    const parts = await dbOperations.getAllParts();
    res.json(parts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching parts' });
  }
});

// POST new spare part
app.post('/api/spare-parts', async (req, res) => {
  const part = req.body;

  try {
    await dbOperations.insertPart(part);
    res.status(200).json({ message: 'OK' });
  } catch (err: any) {
    console.error('❌ Error inserting part:', err);
    res.status(500).json({ error: err.message || 'Insert failed' });
  }
});


// PUT update quantity
app.put('/api/spare-parts/:id', async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, reason, message } = req.body;
    await dbOperations.updateQuantity(id, quantity, reason, message);

    res.json({ message:'Quantity updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating quantity' });
  }
});

// POST import multiple parts
app.post('/api/spare-parts/import', async (req, res): Promise<void> => {
  try {
    const { parts } = req.body;
    await dbOperations.importParts(parts);
    res.json({ message: 'Parts imported' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error importing parts' });
  }
});

// GET app settings
app.get('/api/app-settings', async (req, res): Promise<void> => {
  try {
    const settings = await dbOperations.getSettings();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching settings' });
  }
});

// POST update settings
app.post('/api/app-settings', async (req, res): Promise<void> => {
  try {
    await dbOperations.updateSettings(req.body);
    res.json({ message: 'Settings updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating settings' });
  }
});

// POST upload image
app.post('/api/upload-image', upload.single('image'), async (req, res): Promise<void> => {
  try {
    const { articleNumber } = req.body;
    if (!req.file || !articleNumber) {
      res.status(400).json({ error: 'Missing image or article number' });
      return;
    }
    const imageUrl = await dbOperations.uploadImage(req.file as S3File);
    console.log('📸 Upload imageUrl:', imageUrl);
    res.json({ imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error uploading image' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

// Lagerhistorik
app.get('/api/part-history/:articleNumber', async (req, res): Promise<void> => {
    try {
      const { articleNumber } = req.params;
      const history = await dbOperations.getPartHistory(articleNumber);
      res.json(history);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching part history' });
    }
  });
  
  // Fältändringshistorik
  app.get('/api/field-history/:articleNumber', async (req, res): Promise<void> => {
    try {
      const { articleNumber } = req.params;
      const history = await dbOperations.getFieldHistory(articleNumber);
      res.json(history);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Error fetching field history' });
    }
  });

  app.post('/api/delete-image', async function (req: Request, res: Response): Promise<void> {
    try {
      const { imageUrl } = req.body;
  
      if (!imageUrl) {
        res.status(400).json({ error: 'imageUrl missing' });
        return;
      }
  
      await dbOperations.deleteImage(imageUrl);
      res.status(200).json({ message: 'OK' });
    } catch (err) {
      console.error('Failed to delete image:', err);
      res.status(500).json({ error: 'Error deleting image' });
    }
  });
  
  