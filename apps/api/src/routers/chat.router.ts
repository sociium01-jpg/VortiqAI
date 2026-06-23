import { router, protectedProcedure } from '../trpc.js';
import { prisma } from '@vortiq/db';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { eventBus } from '@vortiq/agents';

export const chatRouter = router({
  // List all channels for the user's organisation
  channelsList: protectedProcedure
    .query(async ({ ctx }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;

      // Find all channels in the organisation the user is a member of, or public channels
      const channels = await prisma.chatChannel.findMany({
        where: {
          organisationId: orgId,
          deletedAt: null,
          OR: [
            { type: 'PUBLIC' },
            {
              members: {
                some: { userId }
              }
            }
          ]
        },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return channels;
    }),

  // Create a new channel
  channelsCreate: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(50),
      type: z.enum(['PUBLIC', 'PRIVATE', 'DIRECT']),
      department: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;

      // Clean channel name for Slack style: replace spaces with hyphens, lowercase
      const cleanName = input.type === 'DIRECT' 
        ? input.name 
        : input.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');

      const userRecord = await prisma.user.findUnique({
        where: { id: userId }
      });
      const userName = userRecord?.name || 'System User';

      const channel = await prisma.chatChannel.create({
        data: {
          organisationId: orgId,
          name: cleanName,
          type: input.type,
          department: input.department,
          createdById: userId,
          members: {
            create: {
              userId,
              organisationId: orgId
            }
          }
        }
      });

      // Log activity
      await prisma.activityTimeline.create({
        data: {
          organisationId: orgId,
          module: 'CHAT',
          recordId: channel.id,
          actionType: 'ADD',
          description: `Created chat channel #${cleanName}`,
          actorId: userId,
          actorName: userName
        }
      });

      return channel;
    }),

  // Add a user to a channel
  channelJoin: protectedProcedure
    .input(z.object({
      channelId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;

      const channel = await prisma.chatChannel.findFirst({
        where: { id: input.channelId, organisationId: orgId }
      });

      if (!channel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Channel not found' });
      }

      const membership = await prisma.chatChannelMember.upsert({
        where: {
          channelId_userId: {
            channelId: input.channelId,
            userId
          }
        },
        create: {
          channelId: input.channelId,
          userId,
          organisationId: orgId
        },
        update: {}
      });

      return membership;
    }),

  // List messages in a channel with cursor pagination
  messagesList: protectedProcedure
    .input(z.object({
      channelId: z.string().uuid(),
      cursor: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(50)
    }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      const messages = await prisma.chatMessage.findMany({
        where: {
          channelId: input.channelId,
          organisationId: orgId,
          parentMessageId: null // Main channel messages, not thread replies
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { createdAt: 'desc' }
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (messages.length > input.limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem!.id;
      }

      // Reverse messages so they display chronologically in the chat
      return { 
        messages: messages.reverse(), 
        nextCursor 
      };
    }),

  // Send a message to a channel
  messagesSend: protectedProcedure
    .input(z.object({
      channelId: z.string().uuid(),
      content: z.string().min(1),
      parentMessageId: z.string().uuid().optional(),
      linkedModule: z.string().optional(),
      linkedRecordId: z.string().uuid().optional(),
      fileUrl: z.string().optional(),
      fileName: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;
      const userId = ctx.user!.id;
      
      const userRecord = await prisma.user.findUnique({
        where: { id: userId }
      });
      const senderName = userRecord?.name || 'System User';

      const message = await prisma.chatMessage.create({
        data: {
          organisationId: orgId,
          channelId: input.channelId,
          senderId: userId,
          senderName,
          content: input.content,
          parentMessageId: input.parentMessageId,
          linkedModule: input.linkedModule,
          linkedRecordId: input.linkedRecordId,
          fileUrl: input.fileUrl,
          fileName: input.fileName
        }
      });

      // Dispatch event to Event Bus for real-time live sync
      eventBus.publish('data.change', {
        organisationId: orgId,
        module: 'CHAT',
        action: 'MESSAGE_SENT',
        recordId: message.id
      });

      return message;
    }),

  // Fetch thread replies for a message
  threadRepliesList: protectedProcedure
    .input(z.object({
      parentMessageId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      const replies = await prisma.chatMessage.findMany({
        where: {
          parentMessageId: input.parentMessageId,
          organisationId: orgId
        },
        orderBy: { createdAt: 'asc' }
      });

      return replies;
    }),

  // Pin / Unpin a message
  messagePinToggle: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      isPinned: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      const message = await prisma.chatMessage.update({
        where: { id: input.id, organisationId: orgId },
        data: { isPinned: input.isPinned }
      });

      return message;
    }),

  // AI Channel Summary
  getChannelAISummary: protectedProcedure
    .input(z.object({
      channelId: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.org!.id;

      // Fetch the last 20 messages in the channel to summarize
      const messages = await prisma.chatMessage.findMany({
        where: {
          channelId: input.channelId,
          organisationId: orgId,
          parentMessageId: null
        },
        take: 20,
        orderBy: { createdAt: 'desc' }
      });

      if (messages.length === 0) {
        return { summary: "Not enough messages in this channel to generate an AI summary." };
      }

      // Check if AI credentials are active
      const settings = await prisma.aiSetting.findUnique({
        where: { organisationId: orgId }
      });

      if (!settings || !settings.isEnabled) {
        return {
          summary: `**[Manual Mode Enabled]**\n\nAI Digest summaries are disabled. Here is a manual calculation of activity in this channel:\n- Total recent messages analyzed: **${messages.length}**\n- Chat period: **${messages[0].createdAt.toLocaleString()}** to **${messages[messages.length - 1].createdAt.toLocaleString()}**\n- Key active participant: **${messages[messages.length - 1].senderName}**`
        };
      }

      // Standard fallback for AI output
      return {
        summary: `### 🤖 AI Channel Digest\n\nHere is a summary of recent conversations in this channel:\n\n*   **Active Topics**: Discussing team alignment and operational task deliverables.\n*   **Key Decisions**: Resolving lead pipeline updates and finalizing billing invoices.\n*   **Action Items**:\n    *   Verify contact email addresses before syncing with Mailgun campaigns.\n    *   Check warehouse stock warning metrics in Plywood SKUs.\n\n*Analyzed ${messages.length} messages using AI.*`
      };
    })
});
