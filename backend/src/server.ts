import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env or .env.local (backend or root)
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Twilio Verify Active


import authRouter from './routes/auth';
import otpRouter from './routes/otp';
import adminRouter from './routes/admin';
import cropCyclesRouter from './routes/cropCycles';
import expensesRouter from './routes/expenses';
import incomeRouter from './routes/income';
import profitRouter from './routes/profit';
import dashboardRouter from './routes/dashboard';
import { testConnection, isPostgresConfigured } from './db';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001'],
    credentials: true,
  })
);
app.use(express.json());

// Request logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'healthy',
    postgresConfigured: isPostgresConfigured(),
    postgresConnected: dbConnected,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth/otp', otpRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/crop-cycles', cropCyclesRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/income', incomeRouter);
app.use('/api/profit', profitRouter);
app.use('/api/dashboard', dashboardRouter);

// 404 Handler
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.get('/', (req, res) => {
  res.send('AgriTrack Backend is running!');
});

// Start Server
app.listen(PORT, async () => {
  console.log(`=========================================`);
  console.log(`🌾 AgriTrack Express Backend Engine`);
  console.log(`🚀 Running at: http://localhost:${PORT}`);
  console.log(`📡 API Endpoints: http://localhost:${PORT}/api`);
  console.log(`🐘 PostgreSQL Status: ${isPostgresConfigured() ? 'Configured' : 'Offline (Fallback Mode Active)'}`);
  console.log(`=========================================`);
});

export default app;
