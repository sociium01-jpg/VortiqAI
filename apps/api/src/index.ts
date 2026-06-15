import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc.js';
import { appRouter } from './routers/app.router.js';

// Import cron scheduler to start cron jobs
import './cron/scheduler.js';

const app = express();

app.use(cors());
app.use(express.json());

// Root endpoint returning JSON
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Welcome to the VORTIQ Business OS API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      trpc: '/trpc'
    }
  });
});

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'vortiq-api' });
});

// Setup tRPC express adapter middleware
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
    responseMeta({ errors }) {
      const hasPlanLimit = errors.some(
        (err) => err.code === 'FORBIDDEN' && err.message.includes('PLAN_LIMIT')
      );
      if (hasPlanLimit) {
        return {
          status: 402,
        };
      }
      return {};
    }
  })
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`[API] Server is listening on http://localhost:${PORT}`);
  console.log(`[API] tRPC endpoint is at http://localhost:${PORT}/trpc`);
});
