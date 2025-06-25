// src/index.ts
import express from 'express';
import { consumeLeads } from './consumer';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/consume', async (req, res) => {
    await consumeLeads();
    res.send('Consumed one lead from Redis');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});