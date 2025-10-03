import { ExpenseTable } from "@/client/components/expenses/expense-table";

interface ExpenseHistoryPageProps {
  sessionId: string;
  isAdmin: boolean;
}

export function ExpenseHistoryPage({
  sessionId,
  isAdmin,
}: ExpenseHistoryPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Expense History</h1>
      <ExpenseTable sessionId={sessionId} isAdmin={isAdmin} />
    </div>
  );
}
