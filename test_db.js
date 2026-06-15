const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing Prisma database connection from project root...');
  try {
    const orgsCount = await prisma.organisation.count();
    console.log('Organisations count:', orgsCount);
    const usersCount = await prisma.user.count();
    console.log('Users count:', usersCount);
    const contactsCount = await prisma.contact.count();
    console.log('Contacts count:', contactsCount);
    const leadsCount = await prisma.leadRecord.count();
    console.log('Lead records count:', leadsCount);
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
