// src/index.ts
import express from 'express';
import { leadService } from './consumer';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/get-leads', async (req, res) => {
    const leads = await leadService.getLeads();
    res.json(leads);
});

app.get('/consume', async (req, res) => {
    await leadService.consumeLead();
    res.send('Consumed one lead from Redis');
});

app.delete('/delete', async (req, res) => {
    await leadService.deleteLead();
    res.send('Deleted old articles older than 4 days');
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});