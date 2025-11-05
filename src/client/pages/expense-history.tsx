import { useState } from "react";
import { ExpenseTable } from "@/client/components/expenses/expense-table";
import { UploadForm } from "@/client/components/expenses/upload-form";

interface ExpenseHistoryPageProps {
  sessionId: string;
  isAdmin: boolean;
}

export function ExpenseHistoryPage({
  sessionId,
  isAdmin,
}: ExpenseHistoryPageProps) {
  const [editingExpense, setEditingExpense] = useState<any>(null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Expense History</h1>
      {editingExpense && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold dark:text-white">Edit Expense</h2>
            <button
              onClick={() => setEditingExpense(null)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
          <UploadForm
            sessionId={sessionId}
            editingExpense={editingExpense}
            onSuccess={() => setEditingExpense(null)}
          />
        </div>
      )}
      <ExpenseTable sessionId={sessionId} isAdmin={isAdmin} onEdit={setEditingExpense} />
    </div>
  );
}
