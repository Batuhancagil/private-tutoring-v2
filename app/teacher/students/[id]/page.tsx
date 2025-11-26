import { redirect } from 'next/navigation';
import { requireTeacherWithSubscription } from '@/lib/teacher-page-helpers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { StudentDetailClient } from '@/components/teacher/StudentDetailClient';

interface StudentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const user = await requireTeacherWithSubscription();
  const { id } = await params;

  // Fetch student with tenant isolation check
  const studentData = await prisma.user.findFirst({
    where: {
      id,
      role: UserRole.STUDENT,
      teacherId: user.userId, // Tenant isolation: only current teacher's students
    },
    select: {
      id: true,
      username: true,
      role: true,
      teacherId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!studentData) {
    // Student not found or doesn't belong to this teacher
    redirect('/teacher/students');
  }

  // Convert Date objects to strings for client component
  const student = {
    ...studentData,
    createdAt: studentData.createdAt.toISOString(),
    updatedAt: studentData.updatedAt.toISOString(),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Student Details
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage student information and parent assignments
          </p>
        </div>

        <StudentDetailClient student={student} />
      </div>
    </DashboardLayout>
  );
}

