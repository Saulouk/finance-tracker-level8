import { AdminPanel } from "@/client/components/admin/admin-panel";

interface AdminPageProps {
  sessionId: string;
}

export function AdminPage({ sessionId }: AdminPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Admin Panel</h1>
      <AdminPanel sessionId={sessionId} />
    </div>
  );
}
