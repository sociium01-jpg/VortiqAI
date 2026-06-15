import { prisma } from '@vortiq/db';

export class AgentMemoryService {
  private static instance: AgentMemoryService;

  private constructor() {}

  public static getInstance(): AgentMemoryService {
    if (!AgentMemoryService.instance) {
      AgentMemoryService.instance = new AgentMemoryService();
    }
    return AgentMemoryService.instance;
  }

  /**
   * Stores an agent action or fact as a memory, isolated by organisationId.
   */
  public async store(params: {
    agentType: string;
    organisationId: string;
    content: string;
    metadata?: any;
    embedding?: number[];
  }): Promise<void> {
    const { agentType, organisationId, content, metadata } = params;
    
    console.log(`[AGENT_MEMORY] Storing memory for ${agentType} in org ${organisationId}: "${content}"`);
    
    // Save to ActivityLog as semantic memory log
    await prisma.activityLog.create({
      data: {
        organisationId,
        actor: `${agentType.toUpperCase()}_AGENT`,
        description: `Memory saved: ${content} (Meta: ${JSON.stringify(metadata || {})})`
      }
    });

    // In a production app with pgvector, you would run:
    // await prisma.$executeRaw`INSERT INTO "AgentMemory" (id, "organisationId", "agentType", content, embedding) VALUES (...)`
  }

  /**
   * Retrieves memories using vector cosine similarity.
   */
  public async retrieve(params: {
    agentType: string;
    organisationId: string;
    query: string;
    limit?: number;
  }): Promise<any[]> {
    const { agentType, organisationId, query, limit = 5 } = params;
    
    console.log(`[AGENT_MEMORY] Querying memory for ${agentType} in org ${organisationId} with query: "${query}"`);
    
    // In production with pgvector, we would do:
    // const queryVector = await generateEmbeddings(query);
    // return prisma.$queryRaw`SELECT content, metadata FROM "AgentMemory" WHERE "organisationId" = ${organisationId}::uuid AND "agentType" = ${agentType} ORDER BY embedding <=> ${queryVector}::vector LIMIT ${limit}`;
    
    // Fallback search in ActivityLog
    const logs = await prisma.activityLog.findMany({
      where: {
        organisationId,
        actor: `${agentType.toUpperCase()}_AGENT`,
        description: {
          contains: query,
          mode: 'insensitive'
        }
      },
      take: limit
    });

    return logs.map((l: any) => ({
      content: l.description.replace('Memory saved: ', ''),
      createdAt: l.createdAt
    }));
  }
}

export const agentMemoryService = AgentMemoryService.getInstance();
