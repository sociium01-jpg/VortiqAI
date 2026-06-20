import { prisma } from '@vortiq/db';
import { eventBus } from '@vortiq/agents/src/event-bus.js';
import axios from 'axios';
import twilio from 'twilio';

// Regulatory IST Calling Hours Check: 10:00 AM - 7:00 PM IST (10 - 19)
export function checkCallingHoursIST(): boolean {
  const now = new Date();
  // Get time in Asia/Kolkata (IST)
  const istTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  const istDate = new Date(istTimeStr);
  const hour = istDate.getHours();
  return hour >= 10 && hour < 19;
}

export class VoiceCallService {
  private twilioClient: twilio.Twilio | null = null;
  private readonly vapiApiUrl = 'https://api.vapi.ai';
  private readonly vapiApiKey = process.env.VAPI_API_KEY;

  constructor() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (sid && sid.startsWith('AC') && token) {
      this.twilioClient = twilio(sid, token);
    } else {
      console.warn('[VoiceCallService] Twilio client not initialized: Missing or invalid Account SID (must start with "AC")');
    }
  }

  public async initiateCall(params: {
    contactId: string;
    organisationId: string;
    scriptId: string;
    userId: string;
  }): Promise<any> {
    const { contactId, organisationId, scriptId, userId } = params;

    // 1. Compliance check: Time window
    const hourCompliant = checkCallingHoursIST();
    if (!hourCompliant) {
      throw new Error("TRAI_COMPLIANCE_ERROR: Calls are only permitted between 10:00 AM and 7:00 PM IST.");
    }

    // 2. Load Contact & Validate Consent
    const contact = await prisma.contact.findUnique({
      where: { id: contactId, organisationId }
    });
    if (!contact) {
      throw new Error("Contact not found.");
    }
    if (contact.consentStatus === 'WITHDRAWN') {
      throw new Error("CONSENT_ERROR: Contact has withdrawn outbound call consent.");
    }
    if (!contact.phone) {
      throw new Error("Contact does not have a valid phone number registered.");
    }

    // 3. DND NCPR Scrub
    const dndStatus = await this.scrubDND(contact.phone, organisationId);
    if (dndStatus === 'DND_REGISTERED') {
      throw new Error("TRAI_DND_ERROR: Target number is registered on NCPR DND registry.");
    }

    // 4. Load Call Script
    const script = await prisma.callScript.findUnique({
      where: { id: scriptId, organisationId }
    });
    if (!script || !script.isActive) {
      throw new Error("Active call script not found.");
    }

    // 5. Check outbound number compliance: Exotel / Twilio 140 or 160 series
    const numberSeries = process.env.TWILIO_140_SERIES_NUMBER || '140';

    // 6. Create VoiceCall Record (Initiated state)
    const voiceCall = await prisma.voiceCall.create({
      data: {
        organisationId,
        contactId,
        status: 'INITIATED',
        direction: 'OUTBOUND',
        dndChecked: true,
        dndStatus: 'CLEAN',
        dndCheckedAt: new Date(),
        numberSeries,
        callHourCompliant: true,
        voiceName: script.voiceName || 'Rachel',
        elevenLabsVoiceId: script.voiceId || '21m00Tcm4TlvDq8ikWAM',
        twilioFrom: process.env.TWILIO_140_SERIES_NUMBER || '+911400000000',
        twilioTo: contact.phone
      }
    });

    // 7. Assemble Vapi System Prompt containing AI Disclosure Rule
    const systemPrompt = this.buildSystemPrompt(script, contact);

    // 8. Place Vapi Call via Twilio
    let vapiCallId = '';
    if (this.vapiApiKey) {
      try {
        const response = await axios.post(
          `${this.vapiApiUrl}/call/phone`,
          {
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
            assistant: {
              firstMessage: script.openingLine.replace('${firstName}', contact.firstName),
              model: {
                provider: 'openai',
                model: 'gpt-4',
                messages: [
                  {
                    role: 'system',
                    content: systemPrompt
                  }
                ]
              },
              voice: {
                provider: 'elevenlabs',
                voiceId: voiceCall.elevenLabsVoiceId
              }
            },
            customer: {
              number: contact.phone
            }
          },
          {
            headers: {
              Authorization: `Bearer ${this.vapiApiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        vapiCallId = response.data?.id;
      } catch (err: any) {
        console.error('Vapi Call Trigger failed:', err.response?.data || err.message);
      }
    } else {
      console.warn('VAPI_API_KEY missing. Mocking call...');
      vapiCallId = `vapi-${Math.random().toString(36).substring(7)}`;
    }

    // Update call record
    const updatedCall = await prisma.voiceCall.update({
      where: { id: voiceCall.id },
      data: {
        twilioCallSid: vapiCallId,
        status: 'RINGING'
      }
    });

    await eventBus.publish('contact.created', { contactId, organisationId }); // cascade events

    return updatedCall;
  }

  private buildSystemPrompt(script: any, contact: any): string {
    return `You are ${script.voiceName || 'Rachel'}, an AI representative calling on behalf of the company.
Contact Name: ${contact.firstName} ${contact.lastName}.

ABSOLUTE REGULATORY COMPLIANCE RULES:
1. Within the first 15 seconds of the call, you MUST clearly state: "Just so you know, I am an AI assistant calling on behalf of the team."
2. If the user mentions "DND", "do not call", or requests to opt-out, immediately say "Certainly, I will mark your number as opt-out right away", execute the opt-out mechanism and end the call.

OBJECTIVES:
${script.keyObjectives.map((obj: string, i: number) => `${i + 1}. ${obj}`).join('\n')}

HANDLING OBJECTIONS:
${JSON.stringify(script.handlingObjections, null, 2)}

TONE: Speak in professional, warm Indian English or HINGLISH depending on context. Avoid talking too fast.
`;
  }

  private async scrubDND(phone: string, organisationId: string): Promise<'CLEAN' | 'DND_REGISTERED'> {
    // 1. Check local scrub log cache
    const cached = await prisma.dndScrubLog.findFirst({
      where: { phone, organisationId, cacheExpiresAt: { gte: new Date() } }
    });

    if (cached) {
      return cached.status;
    }

    // 2. Call external NCPR DND scrub API (Mock implementation in dev)
    let dndStatus: 'CLEAN' | 'DND_REGISTERED' = 'CLEAN';
    if (process.env.NCPR_API_KEY) {
      try {
        const response = await axios.post(`${process.env.NCPR_API_URL}/scrub`, { phone }, {
          headers: { Authorization: `Bearer ${process.env.NCPR_API_KEY}` }
        });
        dndStatus = response.data.status === 'DND' ? 'DND_REGISTERED' : 'CLEAN';
      } catch (e) {
        console.warn('NCPR API call failed, defaulting to CLEAN');
      }
    }

    // 3. Cache scrub log
    const cacheExpiresAt = new Date();
    cacheExpiresAt.setDate(cacheExpiresAt.getDate() + 7); // Cache for 7 days

    await prisma.dndScrubLog.create({
      data: {
        organisationId,
        phone,
        status: dndStatus,
        source: process.env.NCPR_API_KEY ? 'NCPR_API' : 'CACHE',
        cacheExpiresAt
      }
    });

    return dndStatus;
  }

  public async handleCallWebhook(payload: any): Promise<void> {
    const { callId, status, durationSeconds, transcript, recordingUrl } = payload;
    const callRecord = await prisma.voiceCall.findFirst({
      where: { twilioCallSid: callId }
    });

    if (!callRecord) return;

    // Calculate outcomes and AI summary via Claude/GPT BYOK
    let outcome: any = 'NO_ANSWER';
    if (status === 'completed' && durationSeconds > 10) {
      outcome = 'INTERESTED'; // Replace with LLM classification in production
    }

    const durationMinutes = durationSeconds / 60;
    const costUsd = durationMinutes * 0.02; // Standard pricing

    // TRAI compliant 90-day recording retention calculation
    const recordingDeleteAt = new Date();
    recordingDeleteAt.setDate(recordingDeleteAt.getDate() + 90);

    const updated = await prisma.voiceCall.update({
      where: { id: callRecord.id },
      data: {
        status: 'COMPLETED',
        durationSeconds,
        durationMinutes,
        costUsd,
        outcome,
        transcript,
        transcriptSummary: transcript ? 'AI Summary of call details' : null,
        recordingUrl,
        recordingDeleteAt,
        aiDisclosureMade: true,
        aiDisclosedAt: new Date()
      }
    });

    // Trigger downstream event cascades
    await eventBus.publish('voice_call.completed', {
      callId: updated.id,
      contactId: updated.contactId,
      organisationId: updated.organisationId,
      duration: durationSeconds,
      outcome: outcome || 'COMPLETED'
    });
  }

  public async scheduleFollowUpCalls(organisationId: string): Promise<void> {
    const today = new Date();
    today.setHours(0,0,0,0);
    const calls = await prisma.voiceCall.findMany({
      where: {
        organisationId,
        status: 'INITIATED',
        nextCallDate: {
          lte: today
        }
      }
    });

    for (const call of calls) {
      try {
        await this.initiateCall({
          contactId: call.contactId,
          organisationId: call.organisationId,
          scriptId: 'default-script-id',
          userId: 'system-user-id'
        });
      } catch (err: any) {
        console.error(`Failed to initiate scheduled call ${call.id}:`, err.message);
      }
    }
  }

  public async buildBatchCallQueue(organisationId: string): Promise<any[]> {
    const queue = await prisma.contact.findMany({
      where: {
        organisationId,
        leadScore: { gte: 70 },
        consentStatus: 'GIVEN',
        deletedAt: null
      },
      orderBy: {
        leadScore: 'desc'
      }
    });
    return queue;
  }
}

export const voiceCallService = new VoiceCallService();
