/**
 * Vortiq AI Provider Bridge
 * Server-side only. API keys are decrypted from the database and never exposed to the frontend.
 * Supports OpenAI, Google Gemini, and Anthropic Claude.
 */
import crypto from 'crypto';
import { prisma } from '@vortiq/db';

const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function decrypt(encryptedText: string): string {
  try {
    if (encryptedText.startsWith('ENCRYPTION_FAILED:')) {
      return encryptedText.replace('ENCRYPTION_FAILED:', '');
    }
    const [ivHex, encryptedHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');
    const encryptedBuffer = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedBuffer);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    throw new Error('API key decryption failed. Key may be corrupted or re-encrypted.');
  }
}

async function getActiveProviderKey(orgId: string): Promise<{ provider: string; apiKey: string; model: string } | null> {
  const settings = await prisma.aiSetting.findUnique({ where: { organisationId: orgId } });
  if (!settings || !settings.isEnabled) return null;

  const conn = await prisma.aiProviderConnection.findFirst({
    where: { organisationId: orgId, provider: settings.provider, isActive: true }
  });
  if (!conn) return null;

  const apiKey = decrypt(conn.apiKeyEncrypted);
  return { provider: settings.provider, apiKey, model: settings.modelName };
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userContext: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContext }
      ],
      max_tokens: 800,
      temperature: 0.3
    })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }
  const data = await response.json() as any;
  return data.choices?.[0]?.message?.content || 'No response from AI provider.';
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, userContext: string): Promise<string> {
  const geminiModel = model.includes('gemini') ? model : 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${systemPrompt}\n\n${userContext}` }]
      }],
      generationConfig: { maxOutputTokens: 800, temperature: 0.3 }
    })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }
  const data = await response.json() as any;
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI provider.';
}

async function callAnthropic(apiKey: string, model: string, systemPrompt: string, userContext: string): Promise<string> {
  const anthropicModel = model.includes('claude') ? model : 'claude-3-haiku-20240307';
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: anthropicModel,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContext }]
    })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }
  const data = await response.json() as any;
  return data.content?.[0]?.text || 'No response from AI provider.';
}

/**
 * Main server-side AI call gateway.
 * Fetches org's active provider + decrypted key, then routes to correct LLM.
 * Returns { response, tokensUsed, model } or null if AI disabled/not connected.
 */
export async function callAIProvider(
  orgId: string,
  systemPrompt: string,
  userContext: string,
  userId?: string,
  agentName?: string,
  module?: string
): Promise<{ response: string; tokensUsed: number; model: string } | null> {
  const providerConfig = await getActiveProviderKey(orgId);

  if (!providerConfig) {
    // Log as not-connected but don't throw — caller handles graceful fallback
    await prisma.aiErrorLog.create({
      data: {
        organisationId: orgId,
        userId,
        component: 'ProviderGateway',
        errorMessage: 'AI provider not connected or AI is disabled for this organisation.',
        context: { agentName, module } as any
      }
    }).catch(() => {}); // silent if logging fails
    return null;
  }

  const { provider, apiKey, model } = providerConfig;
  let response = '';
  let tokensUsed = 0;

  try {
    if (provider === 'OPENAI') {
      response = await callOpenAI(apiKey, model, systemPrompt, userContext);
    } else if (provider === 'GEMINI') {
      response = await callGemini(apiKey, model, systemPrompt, userContext);
    } else if (provider === 'ANTHROPIC') {
      response = await callAnthropic(apiKey, model, systemPrompt, userContext);
    } else {
      throw new Error(`Unknown AI provider: ${provider}`);
    }

    // Rough token estimate (4 chars per token)
    tokensUsed = Math.ceil((systemPrompt.length + userContext.length + response.length) / 4);

    // Log successful AI output
    await prisma.aiOutputLog.create({
      data: {
        organisationId: orgId,
        requestId: crypto.randomUUID(),
        userId,
        agentName: agentName || 'UnknownAgent',
        module: module || 'GENERAL',
        inputContext: userContext.substring(0, 500),
        outputSummary: response.substring(0, 500),
        model,
        tokensUsed,
        confidence: 0.88
      }
    }).catch(() => {});

    // Track usage + cost
    const costUsd = tokensUsed * (provider === 'OPENAI' ? 0.000015 : 0.0000001);
    await prisma.aiUsageLog.create({
      data: {
        organisationId: orgId,
        userId,
        action: `${agentName || 'AI'}_CALL`,
        tokensUsed,
        costUsd
      }
    }).catch(() => {});

    return { response, tokensUsed, model };
  } catch (err: any) {
    // Log error
    await prisma.aiErrorLog.create({
      data: {
        organisationId: orgId,
        userId,
        component: provider,
        errorMessage: err.message || 'Unknown AI provider error',
        errorStack: err.stack,
        context: { agentName, module } as any
      }
    }).catch(() => {});
    throw err;
  }
}
