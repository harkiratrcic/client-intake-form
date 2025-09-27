import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Create your admin account
    const email = 'admin@formflow.ca'; // Change this to your email
    const password = 'Admin123!'; // Change this to your password

    // Check if owner already exists
    const existingOwner = await prisma.owner.findUnique({
      where: { email }
    });

    if (existingOwner) {
      console.log('❌ Admin account already exists with this email');
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the owner account
    const owner = await prisma.owner.create({
      data: {
        email,
        passwordHash: hashedPassword,
        businessName: 'FormFlow Admin',
        rcicNumber: 'R123456', // Update with your real RCIC number if needed
      }
    });

    console.log('✅ Admin account created successfully!');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('');
    console.log('You can now login at your deployed app with these credentials.');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();