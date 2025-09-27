const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('Testing Supabase connection...');

  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection successful!', result);

    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log('Existing tables:', tables);

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();