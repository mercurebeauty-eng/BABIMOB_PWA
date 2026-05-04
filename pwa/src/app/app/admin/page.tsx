'use client';

export const dynamic = 'force-dynamic';

import AdminLayout from '@/components/admin/AdminLayout';
import AdminOverview from '@/components/admin/AdminOverview';

export default function AdminPage() {
  return (
    <AdminLayout>
      <AdminOverview />
    </AdminLayout>
  );
}
