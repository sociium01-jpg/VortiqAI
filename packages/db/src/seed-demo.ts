import { PrismaClient, UserRole, ContactSource, ContactStatus, ConsentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database tables...');
  await prisma.dndScrubLog.deleteMany({});
  await prisma.voiceCall.deleteMany({});
  await prisma.callScript.deleteMany({});
  await prisma.salesTarget.deleteMany({});
  await prisma.businessEfficiencyScore.deleteMany({});
  await prisma.employeePerformance.deleteMany({});
  await prisma.briefingLog.deleteMany({});
  await prisma.telegramSession.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.dealStage.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organisation.deleteMany({});

  console.log('Seeding demo organizations...');

  // 1. Create 3 Demo Organisations
  const org1 = await prisma.organisation.create({
    data: {
      name: 'Alpha Real Estate Developers',
      slug: 'alpha-developers',
      gstin: '27AAAAA1111A1Z1',
      plan: 'GROWTH'
    }
  });

  const org2 = await prisma.organisation.create({
    data: {
      name: 'Vortiq B2B SaaS Systems',
      slug: 'vortiq-saas',
      gstin: '27BBBBB2222B2Z2',
      plan: 'ENTERPRISE'
    }
  });

  const org3 = await prisma.organisation.create({
    data: {
      name: 'Chennai Sheet Metal Fab',
      slug: 'chennai-metal',
      gstin: '33CCCCC3333C3Z3',
      plan: 'STARTER'
    }
  });

  // Create default deal stages for org1
  const stageQualified = await prisma.dealStage.create({
    data: {
      organisationId: org1.id,
      name: 'QUALIFIED',
      order: 1,
      probability: 0.2
    }
  });

  const stageNegotiation = await prisma.dealStage.create({
    data: {
      organisationId: org1.id,
      name: 'NEGOTIATION',
      order: 2,
      probability: 0.6
    }
  });

  const stageWon = await prisma.dealStage.create({
    data: {
      organisationId: org1.id,
      name: 'WON',
      order: 3,
      probability: 1.0,
      isWon: true
    }
  });

  // 2. Create Users (Human-in-the-loop operators)
  const user1 = await prisma.user.create({
    data: {
      organisationId: org1.id,
      clerkId: 'clerk_user_1',
      email: 'ceo@alphadevelopers.in',
      name: 'Amit Sharma',
      role: UserRole.ADMIN
    }
  });

  const user2 = await prisma.user.create({
    data: {
      organisationId: org1.id,
      clerkId: 'clerk_user_2',
      email: 'sales@alphadevelopers.in',
      name: 'Priya Patel',
      role: UserRole.SALES
    }
  });

  // 3. Create Contacts
  const contact1 = await prisma.contact.create({
    data: {
      organisationId: org1.id,
      firstName: 'Ravi',
      lastName: 'Shah',
      email: 'ravi.shah@bharatforge.com',
      phone: '+919876543210',
      companyName: 'Bharat Forge',
      jobTitle: 'VP Procurement',
      leadScore: 89,
      source: ContactSource.MANUAL,
      status: ContactStatus.CUSTOMER,
      consentStatus: ConsentStatus.GIVEN
    }
  });

  // 4. Create Deals
  const deal1 = await prisma.deal.create({
    data: {
      organisationId: org1.id,
      contactId: contact1.id,
      stageId: stageQualified.id,
      title: 'Bharat Forge Outbound Deal',
      value: 1200000,
      probability: 0.73
    }
  });

  // 5. Create Call Scripts (Industry specific scripts)
  await prisma.callScript.create({
    data: {
      organisationId: org1.id,
      name: 'Outbound Luxury Villas Script',
      industry: 'real_estate',
      useCase: 'OUTBOUND_SALES',
      systemPrompt: 'Outbound sales assistant selling luxury property villas.',
      openingLine: "Namaste ${firstName}ji, I'm calling from Alpha Developers regarding premium Hinjewadi layouts.",
      keyObjectives: ['Qualify budget', 'Site visit booking'],
      handlingObjections: { "price_high": "We offer sub-structure payment terms over 3 years." },
      closingLines: ['Thank you for your time Raviji.'],
      language: 'ENGLISH',
      voiceName: 'Rachel',
      voiceId: '21m00Tcm4TlvDq8ikWAM',
      isActive: true
    }
  });

  // 6. Create VoiceCall Log records
  await prisma.voiceCall.create({
    data: {
      organisationId: org1.id,
      contactId: contact1.id,
      dealId: deal1.id,
      direction: 'OUTBOUND',
      status: 'COMPLETED',
      durationSeconds: 94,
      outcome: 'INTERESTED',
      transcript: 'Rachel: Namaste Raviji, I am an AI calling. Ravi: pricing details please. Rachel: Pricing starts at Rs 1.2 Crore.',
      transcriptSummary: 'Contact was highly interested in pricing options. Requested site layout over WhatsApp.',
      dndChecked: true,
      dndStatus: 'CLEAN',
      dndCheckedAt: new Date(),
      numberSeries: '140',
      aiDisclosureMade: true,
      aiDisclosedAt: new Date(),
      callHourCompliant: true,
      durationMinutes: 1.5,
      costUsd: 0.03
    }
  });

  // 7. Sales Target at 73% progress
  await prisma.salesTarget.create({
    data: {
      organisationId: org1.id,
      userId: user1.id,
      period: 'QUARTERLY',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
      targetAmount: 1000000,
      achievedAmount: 730000,
      forecastAmount: 840000,
      successProbability: 0.73,
      status: 'AT_RISK',
      aiInsight: 'Revenue velocity is lagging Q1 progress. outbound campaigns recommended.',
      historicalSuccessRate: 0.8
    }
  });

  // 8. Business Efficiency Scores (last 30 days)
  for (let i = 30; i >= 0; i--) {
    const scoreDate = new Date();
    scoreDate.setDate(scoreDate.getDate() - i);
    await prisma.businessEfficiencyScore.create({
      data: {
        organisationId: org1.id,
        date: scoreDate,
        overallScore: 80 + Math.sin(i) * 5,
        salesScore: 78 + Math.sin(i) * 4,
        marketingScore: 82 + Math.sin(i) * 3,
        operationsScore: 85 + Math.sin(i) * 2,
        financeScore: 80 + Math.sin(i) * 6,
        hrScore: 85,
        supportScore: 90,
        breakdown: { sales: 80, ops: 85 },
        aiNarrative: 'Weekly business velocity showing optimal trends.'
      }
    });
  }

  // 9. Employee Performance
  await prisma.employeePerformance.create({
    data: {
      organisationId: org1.id,
      employeeId: user2.id,
      period: '2026-06',
      score: 91.5,
      tasksCompleted: 14,
      dealsWon: 3,
      attendanceRate: 98.0,
      onTimeRate: 94.0,
      aiNarrative: 'Amit Sharma is currently a top sales performer in the Hinjewadi sector.',
      rank: 1
    }
  });

  // 10. Briefing logs (last 7 days)
  for (let i = 7; i > 0; i--) {
    const briefingDate = new Date();
    briefingDate.setDate(briefingDate.getDate() - i);
    await prisma.briefingLog.create({
      data: {
        organisationId: org1.id,
        userId: user1.id,
        type: 'MORNING',
        channel: 'TELEGRAM',
        content: `Morning Briefing log content from ${briefingDate.toLocaleDateString()}`,
        sentAt: briefingDate,
        deliveryStatus: 'DELIVERED',
        telegramMessageId: `tg-msg-${1000 + i}`
      }
    });
  }

  console.log('Demo database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
