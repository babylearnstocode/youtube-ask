import express from 'express';
import cors from 'cors';

import storeDocumentRoute from './routes/storeDocumentRoutes';

const app = express();

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/store-document', storeDocumentRoute);
export default app;
