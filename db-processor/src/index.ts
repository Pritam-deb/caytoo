// src/index.ts
import express from 'express';
import cors from 'cors';
import { leadService } from './consumer';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.get('/get-leads', async (req, res) => {
    const leads = await leadService.getLeads();
    res.json(leads);
});

app.get('/get-contacted-leads', async (req, res) => {
    const contactedLeads = await leadService.getContactedLeads();
    res.json(contactedLeads);

})

// app.patch('/update-lead', async (req, res) => {
//     const { id } = req.query;
//     if (typeof id !== 'string') {
//         return res.status(400).send('Invalid query parameters');
//     }
//     const updatedLead = await leadService.updateLead(id);
//     if (updatedLead) {
//         res.json(updatedLead);
//     } else {
//         res.status(404).send('Lead not found');
//     }
// });

app.patch("/update-pitched", async (req, res) => {
    const { id } = req.query;
    const updatedLead = await leadService.updatePitched(id as string);
    if (updatedLead) {
        res.json(updatedLead);
    } else {
        res.status(404).send('Lead not found');
    }
})

app.get('/consume', async (req, res) => {
    const totalLeads = await leadService.consumeLead();
    res.send('Consumed leads from Redis: ' + totalLeads.totalLeads);
});

app.delete('/delete', async (req, res) => {
    await leadService.deleteLead();
    res.send('Deleted old articles older than 4 days');
})

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});