import 'dotenv/config';
import express, { type Request, type Response } from 'express';

const app = express();
const port = Number(process.env.PORT) || 3000;

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`backend listening on ${port}`);
});
