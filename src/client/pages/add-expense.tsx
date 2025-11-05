import { UploadForm } from "@/client/components/expenses/upload-form";

interface AddExpensePageProps {
  sessionId: string;
}

export function AddExpensePage({ sessionId }: AddExpensePageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Add Expense</h1>
      <UploadForm sessionId={sessionId} />
    </div>
  );
}
