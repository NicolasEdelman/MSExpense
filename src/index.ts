import express from 'express';
import { expenseRouter } from "./routes/categories";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('futbol');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api', expenseRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});