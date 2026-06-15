import { initTRPC, TRPCError } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { prisma, securityStorage } from '@vortiq/db';
import { PLAN_GATES, PlanTier } from '@vortiq/types';

// Context interface
export interface Context {
  user: {
    id: string;
    clerkId: string;
    email: string;
    role: string;
  } | null;
  org: {
    id: string;
    plan: PlanTier;
  } | null;
}

// Express adapter context creator
export const createContext = async ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions): Promise<Context> => {
  // In development, if headers are absent, use mock developer context
  const mockOrgId = req.headers['x-org-id'] as string;
  const mockUserId = req.headers['x-user-id'] as string;

  if (mockOrgId && mockUserId) {
    const org = await prisma.organisation.findUnique({ where: { id: mockOrgId } });
    const user = await prisma.user.findUnique({ where: { id: mockUserId } });
    if (org && user) {
      return {
        user: { id: user.id, clerkId: user.clerkId, email: user.email, role: user.role },
        org: { id: org.id, plan: org.plan as PlanTier }
      };
    }
  }

  // Fallback default demo account credentials (CEO at Alpha Real Estate Developers)
  const defaultOrg = await prisma.organisation.findFirst({ where: { slug: 'alpha-developers' } });
  const defaultUser = await prisma.user.findFirst({ where: { organisationId: defaultOrg?.id } });
  
  if (defaultOrg && defaultUser) {
    return {
      user: { id: defaultUser.id, clerkId: defaultUser.clerkId, email: defaultUser.email, role: defaultUser.role },
      org: { id: defaultOrg.id, plan: defaultOrg.plan as PlanTier }
    };
  }

  return { user: null, org: null };
};

const t = initTRPC.context<Context>().meta<{ requiredFeature?: string }>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Helper to determine minimum plan for a gated feature
function getMinPlanForFeature(feature: string): PlanTier {
  if (PLAN_GATES.STARTER.features.includes(feature)) return 'STARTER';
  if (PLAN_GATES.GROWTH.features.includes(feature)) return 'GROWTH';
  return 'ENTERPRISE';
}

// Plan Gate Middleware
export const planGateMiddleware = t.middleware(async ({ ctx, next, meta }) => {
  if (!ctx.org) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'No organisation context found.'
    });
  }

  const plan = ctx.org.plan;
  const feature = meta?.requiredFeature;

  if (feature) {
    let mappedPlan: PlanTier = 'STARTER';
    if ((plan as string) === 'GROWTH') mappedPlan = 'GROWTH';
    if ((plan as string) === 'BUSINESS') mappedPlan = 'GROWTH';
    if ((plan as string) === 'ENTERPRISE') mappedPlan = 'ENTERPRISE';
    
    const limits = PLAN_GATES[mappedPlan];
    const isAllowed = limits?.features.includes(feature);
    
    if (!isAllowed) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: JSON.stringify({
          code: 'PLAN_LIMIT',
          feature,
          requiredPlan: getMinPlanForFeature(feature)
        })
      });
    }
  }

  return next();
});

const securityMiddleware = t.middleware(async ({ ctx, next }) => {
  if (ctx.user) {
    return securityStorage.run({ userId: ctx.user.id, isAgent: false }, () => next());
  }
  return next();
});

export const protectedProcedure = t.procedure
  .use(planGateMiddleware)
  .use(securityMiddleware);
export const middleware = t.middleware;
export { t };
