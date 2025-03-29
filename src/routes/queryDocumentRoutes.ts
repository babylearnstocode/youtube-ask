import express, { Request, Response, Router } from 'express';
import { queryDocumentService } from '../services/queryDocumentServices';

const router: Router = express.Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await queryDocumentService(req);
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    result.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
