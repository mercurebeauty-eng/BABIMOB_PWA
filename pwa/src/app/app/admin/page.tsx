import AdminLayout from '@/components/admin/AdminLayout';
import AdminOverview from '@/components/admin/AdminOverview';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <AdminLayout>
      <AdminOverview />
    </AdminLayout>
  );
}
