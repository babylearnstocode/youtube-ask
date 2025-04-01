import express from 'express';
import cors from 'cors';

import storeDocumentRoute from './routes/storeDocumentRoutes';
import queryDocumentRoute from './routes/queryDocumentRoutes';

const app = express();

const corsOptions = {
  origin: 'https://rag-client-sage.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/store-document', storeDocumentRoute);
app.use('/query-document', queryDocumentRoute);
export default app;
