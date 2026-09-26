import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Credentialed CORS: the session cookie only travels to an explicitly allowed origin.
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN ?? 'http://localhost:3000').split(','),
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use((req, res) =>
  res.status(404).json({ success: false, message: "We couldn't find what you were looking for." })
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
