import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Data Collection and Use</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              We collect and use student progress data, assignment information, and communication
              data to provide our tutoring services. All data is stored securely and is only
              accessible to authorized teachers, students, and parents within the same tenant.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>COPPA Compliance</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              For students under 13 years of age, we require parental consent before collecting
              any personal information. Parents can review and manage their child&apos;s data at any time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GDPR Compliance</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              Users have the right to access, export, and delete their data. Teachers can export
              all tenant data through the data export feature. Data is encrypted at rest and in transit.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Security</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              All data is encrypted using industry-standard encryption methods. Data in transit
              is protected by HTTPS/TLS, and data at rest is encrypted by the database provider.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <p>
              For questions about this privacy policy or to exercise your data rights, please
              contact your teacher or system administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

