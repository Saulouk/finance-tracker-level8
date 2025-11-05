import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { rpcClient } from "@/client/rpc-client";

interface IncomeTableProps {
  sessionId: string;
  isAdmin: boolean;
  onEdit?: (income: any) => void;
}

const ROOMS = ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8", "K9", "K10", "Bar"];

export function IncomeTable({ sessionId, isAdmin, onEdit }: IncomeTableProps) {
  const [month, setMonth] = useState("");
  const [room, setRoom] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: incomes = [], refetch } = useQuery({
    queryKey: ["incomes", sessionId, month, room, dateFrom, dateTo],
    queryFn: () =>
      rpcClient.income.list({
        sessionId,
        month: month || undefined,
        room: room || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    refetchInterval: 2000,
  });

  const { mutate: deleteIncome } = useMutation({
    mutationFn: (incomeId: string) =>
      rpcClient.income.deleteIncome({ sessionId, incomeId }),
    onSuccess: () => {
      refetch();
    },
  });

  const handleDelete = (incomeId: string, name: string) => {
    if (confirm(`Are you sure you want to delete income for "${name}"?`)) {
      deleteIncome(incomeId);
    }
  };

  const totalBill = incomes.reduce((sum, i) => sum + i.bill, 0);
  const totalPaid = incomes.reduce((sum, i) => sum + i.paid, 0);
  const totalOutstanding = incomes.reduce((sum, i) => sum + i.outstanding, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Income History</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Room</label>
          <select
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All</option>
            {ROOMS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
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
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Room</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Name</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Bill</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Paid</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Outstanding</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Payment Methods</th>
              {isAdmin && <th className="border dark:border-gray-600 p-2 text-left dark:text-white">User</th>}
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {incomes.map((income) => {
              const hasOutstanding = income.outstanding > 0;
              return (
                <tr key={income.id} className={hasOutstanding ? "bg-yellow-100 dark:bg-yellow-900" : ""}>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">{income.date}</td>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">{income.room}</td>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">{income.name}</td>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">£{income.bill.toFixed(2)}</td>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">£{income.paid.toFixed(2)}</td>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">£{income.outstanding.toFixed(2)}</td>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">
                    {income.paymentMethods.map((pm, idx) => (
                      <div key={idx}>
                        {pm.type}: £{pm.amount.toFixed(2)}
                        {pm.wechatCNY && ` (${pm.wechatCNY})`}
                      </div>
                    ))}
                  </td>
                  {isAdmin && <td className="border dark:border-gray-600 p-2 dark:text-gray-200">{income.username}</td>}
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(income)}
                          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                        >
                          Edit
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(income.id, income.name)}
                          className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
              <td className="border dark:border-gray-600 p-2 dark:text-white" colSpan={3}>Total</td>
              <td className="border dark:border-gray-600 p-2 dark:text-white">£{totalBill.toFixed(2)}</td>
              <td className="border dark:border-gray-600 p-2 dark:text-white">£{totalPaid.toFixed(2)}</td>
              <td className="border dark:border-gray-600 p-2 dark:text-white">£{totalOutstanding.toFixed(2)}</td>
              <td className="border dark:border-gray-600 p-2 dark:text-white" colSpan={isAdmin ? 3 : 2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
