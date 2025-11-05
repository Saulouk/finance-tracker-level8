import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { rpcClient } from "@/client/rpc-client";

interface BalancesPageProps {
  sessionId: string;
  isAdmin: boolean;
}

export function BalancesPage({ sessionId, isAdmin }: BalancesPageProps) {
  const [editingPayment, setEditingPayment] = useState<string | null>(null);
  const [editingDirector, setEditingDirector] = useState<string | null>(null);
  const [overrideAmount, setOverrideAmount] = useState("");

  const { data, refetch } = useQuery({
    queryKey: ["balances", sessionId],
    queryFn: () => rpcClient.balances.getBalances({ sessionId }),
    refetchInterval: 2000,
  });

  const { mutate: setBalanceOverride } = useMutation({
    mutationFn: (data: { paymentType: string; amount: number }) =>
      rpcClient.balances.setBalanceOverride({ sessionId, ...data }),
    onSuccess: () => {
      setEditingPayment(null);
      setOverrideAmount("");
      refetch();
    },
  });

  const { mutate: setDirectorLoanOverride } = useMutation({
    mutationFn: (data: { director: string; amount: number }) =>
      rpcClient.balances.setDirectorLoanOverride({ sessionId, ...data }),
    onSuccess: () => {
      setEditingDirector(null);
      setOverrideAmount("");
      refetch();
    },
  });

  const { mutate: clearBalanceOverride } = useMutation({
    mutationFn: (paymentType: string) =>
      rpcClient.balances.clearBalanceOverride({ sessionId, paymentType }),
    onSuccess: () => {
      refetch();
    },
  });

  const { mutate: clearDirectorLoanOverride } = useMutation({
    mutationFn: (director: string) =>
      rpcClient.balances.clearDirectorLoanOverride({ sessionId, director }),
    onSuccess: () => {
      refetch();
    },
  });

  const handleEditPayment = (type: string, currentAmount: number) => {
    setEditingPayment(type);
    setOverrideAmount(currentAmount.toFixed(2));
  };

  const handleEditDirector = (director: string, currentAmount: number) => {
    setEditingDirector(director);
    setOverrideAmount(currentAmount.toFixed(2));
  };

  const handleSavePaymentOverride = () => {
    if (editingPayment) {
      setBalanceOverride({
        paymentType: editingPayment,
        amount: parseFloat(overrideAmount),
      });
    }
  };

  const handleSaveDirectorOverride = () => {
    if (editingDirector) {
      setDirectorLoanOverride({
        director: editingDirector,
        amount: parseFloat(overrideAmount),
      });
    }
  };

  if (!data) {
    return <div className="dark:text-white">Loading balances...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Balances</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Payment Type Balances</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Payment Type</th>
                <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Calculated Balance</th>
                <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Current Balance</th>
                {isAdmin && <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.balances).map(([type, balance]) => (
                <tr key={type}>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200 font-medium">{type}</td>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">
                    £{balance.calculated.toFixed(2)}
                  </td>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">
                    {editingPayment === type ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={overrideAmount}
                          onChange={(e) => setOverrideAmount(e.target.value)}
                          className="w-32 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <button
                          onClick={handleSavePaymentOverride}
                          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPayment(null)}
                          className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className={balance.override !== undefined ? "font-bold text-blue-600 dark:text-blue-400" : ""}>
                        £{balance.final.toFixed(2)}
                        {balance.override !== undefined && " (Override)"}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="border dark:border-gray-600 p-2 dark:text-gray-200">
                      {editingPayment !== type && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPayment(type, balance.final)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          {balance.override !== undefined && (
                            <button
                              onClick={() => clearBalanceOverride(type)}
                              className="bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 text-sm"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">Director's Loan Balances</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Director</th>
                <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Balance</th>
                {isAdmin && <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.directorLoans).map(([director, loan]) => (
                <tr key={director}>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200 font-medium">{director}</td>
                  <td className="border dark:border-gray-600 p-2 dark:text-gray-200">
                    {editingDirector === director ? (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={overrideAmount}
                          onChange={(e) => setOverrideAmount(e.target.value)}
                          className="w-32 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <button
                          onClick={handleSaveDirectorOverride}
                          className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingDirector(null)}
                          className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className={loan.override !== undefined ? "font-bold text-blue-600 dark:text-blue-400" : ""}>
                        £{loan.final.toFixed(2)}
                        {loan.override !== undefined && " (Override)"}
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="border dark:border-gray-600 p-2 dark:text-gray-200">
                      {editingDirector !== director && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditDirector(director, loan.final)}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                          >
                            Edit
                          </button>
                          {loan.override !== undefined && (
                            <button
                              onClick={() => clearDirectorLoanOverride(director)}
                              className="bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 text-sm"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
