import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc.js';
import { appRouter } from './routers/app.router.js';
import { eventBus } from '@vortiq/agents';

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

// Server-Sent Events endpoint for real-time updates
app.get('/api/events', (req, res) => {
  const orgId = req.query.orgId as string;
  if (!orgId) {
    res.status(400).send('Missing orgId parameter');
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  console.log(`[SSE] Client connected for orgId: ${orgId}`);

  // Subscribe to all Event Bus events
  const unsubscribe = eventBus.subscribeToAll((event, payload) => {
    // Check if the event belongs to this organization
    if (payload && payload.organisationId === orgId) {
      res.write(`data: ${JSON.stringify({ event, payload })}\n\n`);
    }
  });

  req.on('close', () => {
    console.log(`[SSE] Client disconnected for orgId: ${orgId}`);
    unsubscribe();
  });
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
