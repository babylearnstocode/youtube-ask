import express, { Request, Response, Router } from 'express';
import { storeDocumentService } from '../services/storeDocumentServices';

const router: Router = express.Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await storeDocumentService(req);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
