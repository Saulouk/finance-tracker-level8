import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, rpcClient } from "@/client/rpc-client";

interface ExpenseTableProps {
  sessionId: string;
  isAdmin: boolean;
}

export function ExpenseTable({ sessionId, isAdmin }: ExpenseTableProps) {
  const [month, setMonth] = useState("");
  const [category, setCategory] = useState("");
  const [reimbursed, setReimbursed] = useState<boolean | undefined>(undefined);

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", sessionId, month, category, reimbursed],
    queryFn: () =>
      rpcClient.expenses.list({
        sessionId,
        month: month || undefined,
        category: category || undefined,
        reimbursed,
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

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalVat = expenses.reduce((sum, e) => sum + e.vat, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Expenses</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
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
          <label className="block text-sm font-medium mb-1">Reimbursed</label>
          <select
            value={
              reimbursed === undefined ? "" : reimbursed ? "true" : "false"
            }
            onChange={(e) =>
              setReimbursed(
                e.target.value === "" ? undefined : e.target.value === "true"
              )
            }
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Amount</th>
              <th className="border p-2 text-left">VAT</th>
              <th className="border p-2 text-left">Category</th>
              <th className="border p-2 text-left">Purchaser</th>
              {isAdmin && <th className="border p-2 text-left">User</th>}
              <th className="border p-2 text-left">Receipt</th>
              <th className="border p-2 text-left">Reimbursed</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td className="border p-2">{expense.date}</td>
                <td className="border p-2">${expense.amount.toFixed(2)}</td>
                <td className="border p-2">${expense.vat.toFixed(2)}</td>
                <td className="border p-2">{expense.category}</td>
                <td className="border p-2">{expense.purchaser}</td>
                {isAdmin && <td className="border p-2">{expense.username}</td>}
                <td className="border p-2">
                  {expense.receiptPath && (
                    <a
                      href={`/uploads/${expense.receiptPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  )}
                </td>
                <td className="border p-2">
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
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td className="border p-2">Total</td>
              <td className="border p-2">${total.toFixed(2)}</td>
              <td className="border p-2">${totalVat.toFixed(2)}</td>
              <td className="border p-2" colSpan={isAdmin ? 5 : 4}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
