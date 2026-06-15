import { prisma } from '@vortiq/db';

export const INDUSTRY_SCRIPTS: Record<string, {
  openingLine: string;
  keyObjectives: string[];
  handlingObjections: Record<string, string>;
  closingLines: string[];
}> = {
  real_estate: {
    openingLine: "Namaste ${firstName}ji, I'm calling from VORTIQ Real Estate. You recently showed interest in our luxury properties. Is this a good time to talk?",
    keyObjectives: [
      "Qualify buying budget (INR 1Cr+)",
      "Understand purchase timeline",
      "Book a site visit for this coming weekend"
    ],
    handlingObjections: {
      "price_too_high": "I completely understand. We have multiple developer payment plans and options across premium sub-regions. What range fits your budget best?",
      "not_ready_yet": "No worries. Property investments require careful planning. May I know if you're looking for self-use or investment?",
      "need_to_discuss_family": "Absolutely, family decisions are key for real estate. Shall I schedule a joint call with your partner tomorrow?"
    },
    closingLines: [
      "Perfect, I will send the site layouts and virtual walk-through videos over WhatsApp.",
      "Thank you for your time. Looking forward to showing you the project!"
    ]
  },
  b2b_saas: {
    openingLine: "Good morning ${firstName}, I'm calling from VORTIQ. We help businesses automate their workflows and CRM operations. Do you have 2 minutes?",
    keyObjectives: [
      "Identify current automation pain points",
      "Confirm decision-maker authority",
      "Schedule a 15-minute product demo video call"
    ],
    handlingObjections: {
      "using_competitor": "Understood. Many clients switched from legacy tools because of our deep local integrations like Tally and Razorpay. What software are you currently using?",
      "too_expensive": "Our platform pays for itself by reducing operations overhead by 40%. Let me calculate the custom ROI for you on our demo call.",
      "no_budget": "No problem. We can set you up on our free tier so you can test features before your next budget cycle."
    },
    closingLines: [
      "I will email you the calendar invite for the demo.",
      "Have a great day ahead!"
    ]
  },
  manufacturing_b2b: {
    openingLine: "Namaste, I'm calling from VORTIQ Manufacturing. We supply premium raw materials to fabricators in your region. Are you currently sourcing raw materials?",
    keyObjectives: [
      "Confirm buying volumes per month",
      "Identify current supplier bottlenecks",
      "Get a trial sample order booked"
    ],
    handlingObjections: {
      "current_supplier_is_good": "That's great. It's always good to have a backup supplier. Can we quote on your next batch to show our pricing edge?",
      "delivery_delays": "We are integrated with Shiprocket and Delhivery to offer guaranteed SLA shipping across India.",
      "payment_terms": "For established businesses, we offer credit terms supported by Razorpay billing integrations."
    },
    closingLines: [
      "I will send our product catalog and price list on WhatsApp.",
      "Dhanyavaad, talk to you soon!"
    ]
  }
};

export async function generateCallScript(params: {
  organisationId: string;
  name: string;
  industry: 'real_estate' | 'b2b_saas' | 'manufacturing_b2b' | string;
  product: string;
  voiceName?: string;
  voiceId?: string;
}): Promise<any> {
  const { organisationId, name, industry, product, voiceName, voiceId } = params;

  // Fetch from static templates or fall back
  const template = INDUSTRY_SCRIPTS[industry] || INDUSTRY_SCRIPTS.b2b_saas;

  const script = await prisma.callScript.create({
    data: {
      organisationId,
      name,
      industry,
      useCase: 'OUTBOUND_SALES',
      systemPrompt: `Outbound sales assistant for ${product} in the ${industry} industry.`,
      openingLine: template.openingLine,
      keyObjectives: template.keyObjectives,
      handlingObjections: template.handlingObjections,
      closingLines: template.closingLines,
      language: 'ENGLISH',
      voiceName: voiceName || 'Rachel',
      voiceId: voiceId || '21m00Tcm4TlvDq8ikWAM',
      isActive: true
    }
  });

  return script;
}
