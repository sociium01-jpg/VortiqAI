import { router } from '../trpc.js';
import { authRouter } from './auth.router.js';
import { crmRouter } from './crm.router.js';
import { financeRouter } from './finance.router.js';
import { hrRouter } from './hr.router.js';
import { inventoryRouter } from './inventory.router.js';
import { leadEngineRouter } from './lead_engine.router.js';
import { marketingRouter } from './marketing.router.js';
import { salesRouter } from './sales.router.js';
import { supportRouter } from './support.router.js';
import { tasksRouter } from './tasks.router.js';
import { aiRouter } from './ai.router.js';
import { dataSystemRouter } from './data_system.router.js';
import { interconnectRouter } from './interconnect.router.js';
import { chatRouter } from './chat.router.js';

export const appRouter = router({
  auth: authRouter,
  crm: crmRouter,
  finance: financeRouter,
  hr: hrRouter,
  inventory: inventoryRouter,
  leadEngine: leadEngineRouter,
  marketing: marketingRouter,
  sales: salesRouter,
  support: supportRouter,
  tasks: tasksRouter,
  ai: aiRouter,
  dataHub: dataSystemRouter,
  interconnect: interconnectRouter,
  chat: chatRouter
});

export type AppRouter = typeof appRouter;
