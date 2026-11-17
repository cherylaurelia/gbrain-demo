import express from 'express';
import { listsForHousehold } from './lists.js';

const app = express();
app.use(express.json());

app.get('/households/:id/lists', async (req, res) => {
  res.json(await listsForHousehold(req.params.id));
});

app.listen(process.env.PORT || 3000);
