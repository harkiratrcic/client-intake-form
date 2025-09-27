const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Initializing database...');

// Create the database file if it doesn't exist
const dbPath = path.join(process.cwd(), 'prod.db');
if (!fs.existsSync(dbPath)) {
  console.log('Creating database file...');
  fs.writeFileSync(dbPath, '');
}

// Run Prisma migrations
try {
  console.log('Running Prisma migrations...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
  console.log('Database initialized successfully!');
} catch (error) {
  console.error('Failed to initialize database:', error);
  process.exit(1);
}