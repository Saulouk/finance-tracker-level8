import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, rpcClient } from "@/client/rpc-client";

interface ExpenseTableProps {
  sessionId: string;
  isAdmin: boolean;
  onEdit?: (expense: any) => void;
}

export function ExpenseTable({ sessionId, isAdmin, onEdit }: ExpenseTableProps) {
  const [month, setMonth] = useState("");
  const [category, setCategory] = useState("");
  const [reimbursed, setReimbursed] = useState<boolean | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: expenses = [], refetch } = useQuery({
    queryKey: ["expenses", sessionId, month, category, reimbursed, dateFrom, dateTo],
    queryFn: () =>
      rpcClient.expenses.list({
        sessionId,
        month: month || undefined,
        category: category || undefined,
        reimbursed,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    refetchInterval: 2000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => rpcClient.expenses.getCategories(),
  });

  const { mutate: markReimbursed } = useMutation({
    mutationFn: (data: { expenseId: string; isReimbursed: boolean }) =>
      rpcClient.expenses.markReimbursed({ sessionId, ...data }),
  });

  const { mutate: deleteExpense } = useMutation({
    mutationFn: (expenseId: string) =>
      rpcClient.expenses.deleteExpense({ sessionId, expenseId }),
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = (expenseId: string, category: string) => {
    if (confirm(`Are you sure you want to delete expense "${category}"?`)) {
      deleteExpense(expenseId);
    }
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVat = expenses.reduce((sum, e) => sum + e.vat, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Expenses</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Reimbursed</label>
          <select
            value={
              reimbursed === undefined ? "" : reimbursed ? "true" : "false"
            }
            onChange={(e) =>
              setReimbursed(
                e.target.value === "" ? undefined : e.target.value === "true"
              )
            }
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Date</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Amount</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">VAT</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Category</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Purchaser</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Company</th>
              {isAdmin && <th className="border dark:border-gray-600 p-2 text-left dark:text-white">User</th>}
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Receipt</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Reimbursed</th>
              {(isAdmin || onEdit) && <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="border dark:border-gray-600 p-2 dark:text-gray-200">{expense.date}</td>
                <td className="border dark:border-gray-600 p-2 dark:text-gray-200">£{expense.amount.toFixed(2)}</td>
                <td className="border dark:border-gray-600 p-2 dark:text-gray-200">£{expense.vat.toFixed(2)}</td>
                <td className="border dark:border-gray-600 p-2 dark:text-gray-200">{expense.category}</td>
                <td className="border dark:border-gray-600 p-2 dark:text-gray-200">{expense.purchaser}</td>
                <td className="border dark:border-gray-600 p-2 dark:text-gray-200">{expense.company}</td>
                {isAdmin && <td className="border dark:border-gray-600 p-2 dark:text-gray-200">{expense.username}</td>}
                <td className="border dark:border-gray-600 p-2 dark:text-gray-200">
                  {expense.receiptPath && (
                    <a
                      href={`/uploads/${expense.receiptPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View
                    </a>
                  )}
                </td>
                <td className="border dark:border-gray-600 p-2 dark:text-gray-200">
                  {isAdmin ? (
                    <input
                      type="checkbox"
                      checked={expense.isReimbursed}
                      onChange={(e) =>
                        markReimbursed({
                          expenseId: expense.id,
                          isReimbursed: e.target.checked,
                        })
                      }
                    />
                  ) : expense.isReimbursed ? (
                    "Yes"
                  ) : (
                    "No"
                  )}
                </td>
                {(isAdmin || onEdit) && (
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(expense)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                        >
                          Edit
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(expense.id, expense.category)}
                          className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
              <td className="border dark:border-gray-600 p-2 dark:text-white">Total</td>
              <td className="border dark:border-gray-600 p-2 dark:text-white">£{total.toFixed(2)}</td>
              <td className="border dark:border-gray-600 p-2 dark:text-white">£{totalVat.toFixed(2)}</td>
              <td className="border dark:border-gray-600 p-2 dark:text-white" colSpan={isAdmin && onEdit ? 7 : isAdmin || onEdit ? 6 : 5}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
