import { useState } from "react";
import { IncomeTable } from "@/client/components/income/income-table";
import { IncomeUploadForm } from "@/client/components/income/income-upload-form";

interface IncomeHistoryPageProps {
  sessionId: string;
  isAdmin: boolean;
}

export function IncomeHistoryPage({
  sessionId,
  isAdmin,
}: IncomeHistoryPageProps) {
  const [editingIncome, setEditingIncome] = useState<any>(null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Income History</h1>
      {editingIncome && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold dark:text-white">Edit Income</h2>
            <button
              onClick={() => setEditingIncome(null)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
          <IncomeUploadForm
            sessionId={sessionId}
            editingIncome={editingIncome}
            onSuccess={() => setEditingIncome(null)}
          />
        </div>
      )}
      <IncomeTable sessionId={sessionId} isAdmin={isAdmin} onEdit={setEditingIncome} />
    </div>
  );
}
