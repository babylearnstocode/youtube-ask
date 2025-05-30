import express from 'express';
import cors from 'cors';

import storeDocumentRoute from './routes/storeDocumentRoutes';
import queryDocumentRoute from './routes/queryDocumentRoutes';

const app = express();

const corsOptions = {
  origin: [
    'https://rag-client-sage.vercel.app/',
    'https://rag-client-sage.vercel.app',
    `https://${process.env.EC2_CADDY_HOST}/`,
    `https://${process.env.EC2_CADDY_HOST}`,
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/store-document', storeDocumentRoute);
app.use('/query-document', queryDocumentRoute);
export default app;
