import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Superadmin
  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      password: await hashPassword('SuperAdmin123!'),
      role: UserRole.SUPERADMIN,
    },
  });
  console.log('✅ Created superadmin:', superadmin.username);

  // Create Teacher
  const teacher = await prisma.user.upsert({
    where: { username: 'teacher' },
    update: {},
    create: {
      username: 'teacher',
      password: await hashPassword('Teacher123!'),
      role: UserRole.TEACHER,
    },
  });
  console.log('✅ Created teacher:', teacher.username);

  // Create Student (linked to teacher)
  const student = await prisma.user.upsert({
    where: { username: 'student' },
    update: {},
    create: {
      username: 'student',
      password: await hashPassword('Student123!'),
      role: UserRole.STUDENT,
      teacherId: teacher.id,
    },
  });
  console.log('✅ Created student:', student.username);

  // Create Parent
  const parent = await prisma.user.upsert({
    where: { username: 'parent' },
    update: {},
    create: {
      username: 'parent',
      password: await hashPassword('Parent123!'),
      role: UserRole.PARENT,
    },
  });
  console.log('✅ Created parent:', parent.username);

  // Link parent to student
  await prisma.parentStudent.upsert({
    where: {
      parentId_studentId: {
        parentId: parent.id,
        studentId: student.id,
      },
    },
    update: {},
    create: {
      parentId: parent.id,
      studentId: student.id,
    },
  });
  console.log('✅ Linked parent to student');

  console.log('\n📝 Test Users Created:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Superadmin:');
  console.log('  Username: superadmin');
  console.log('  Password: SuperAdmin123!');
  console.log('\nTeacher:');
  console.log('  Username: teacher');
  console.log('  Password: Teacher123!');
  console.log('\nStudent:');
  console.log('  Username: student');
  console.log('  Password: Student123!');
  console.log('\nParent:');
  console.log('  Username: parent');
  console.log('  Password: Parent123!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

