import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, rpcClient } from "@/client/rpc-client";

interface AdminPanelProps {
  sessionId: string;
}

export function AdminPanel({ sessionId }: AdminPanelProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [exportMonth, setExportMonth] = useState("");
  const [exportCategory, setExportCategory] = useState("");
  const [exportReimbursed, setExportReimbursed] = useState<boolean | undefined>(
    undefined
  );
  const [editingUser, setEditingUser] = useState<{ id: string; username: string; isAdmin: boolean } | null>(null);
  const [editPassword, setEditPassword] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  const { data: users = [], refetch } = useQuery({
    queryKey: ["users", sessionId],
    queryFn: () => rpcClient.auth.listUsers(sessionId),
  });

  const { mutate: createUser, isPending } = useMutation({
    mutationFn: (data: {
      username: string;
      password: string;
      isAdmin: boolean;
    }) => rpcClient.auth.createUser({ sessionId, ...data }),
    onSuccess: () => {
      setUsername("");
      setPassword("");
      setIsAdmin(false);
      refetch();
    },
  });

  const { mutate: updateUser, isPending: isUpdating } = useMutation({
    mutationFn: (data: {
      userId: string;
      password?: string;
      isAdmin?: boolean;
    }) => rpcClient.auth.updateUser({ sessionId, ...data }),
    onSuccess: () => {
      setEditingUser(null);
      setEditPassword("");
      refetch();
    },
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: (userId: string) => rpcClient.auth.deleteUser({ sessionId, userId }),
    onSuccess: () => {
      refetch();
    },
  });

  const handleEditUser = (user: { id: string; username: string; isAdmin: boolean }) => {
    setEditingUser(user);
    setEditIsAdmin(user.isAdmin);
    setEditPassword("");
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    const updates: { userId: string; password?: string; isAdmin?: boolean } = {
      userId: editingUser.id,
    };

    if (editPassword) {
      updates.password = editPassword;
    }

    if (editIsAdmin !== editingUser.isAdmin) {
      updates.isAdmin = editIsAdmin;
    }

    updateUser(updates);
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (confirm(`Are you sure you want to delete user "${username}"?`)) {
      deleteUser(userId);
    }
  };

  const handleExportCSV = async () => {
    const csv = await rpcClient.expenses.exportCSV({
      sessionId,
      month: exportMonth || undefined,
      category: exportCategory || undefined,
      reimbursed: exportReimbursed,
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadExpenseTemplate = () => {
    const template = `Date,Amount,VAT,Category,Purchaser,Company
2025-01-15,100.50,20.10,Office Supplies,John Doe,Staples
2025-01-16,250.00,50.00,Travel,Jane Smith,Uber`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expense-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadIncomeTemplate = () => {
    const template = `Date,Room,Name,Bill,Payment Type 1,Payment Amount 1,WeChat CNY,Payment Type 2,Payment Amount 2
2025-01-15,K1,John Doe,500.00,Cash,300.00,,Card,200.00
2025-01-16,Bar,Jane Smith,100.00,WeChat,100.00,650,,`;
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "income-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportExpenseCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",");

    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      try {
        await rpcClient.expenses.create({
          sessionId,
          date: values[0]?.trim() || new Date().toISOString().split("T")[0],
          amount: parseFloat(values[1]?.trim() || "0"),
          vat: parseFloat(values[2]?.trim() || "0"),
          category: values[3]?.trim() || "",
          purchaser: values[4]?.trim() || "",
          company: values[5]?.trim() || "",
        });
        successCount++;
      } catch (err) {
        errorCount++;
      }
    }

    alert(`Import complete: ${successCount} expenses added, ${errorCount} errors`);
    e.target.value = "";
    refetch();
  };

  const handleImportIncomeCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      try {
        const paymentMethods: { type: string; amount: number; wechatCNY?: string }[] = [];
        
        if (values[4]?.trim() && values[5]?.trim()) {
          const payment: { type: string; amount: number; wechatCNY?: string } = {
            type: values[4].trim(),
            amount: parseFloat(values[5].trim()),
          };
          if (values[6]?.trim()) {
            payment.wechatCNY = values[6].trim();
          }
          paymentMethods.push(payment);
        }

        if (values[7]?.trim() && values[8]?.trim()) {
          paymentMethods.push({
            type: values[7].trim(),
            amount: parseFloat(values[8].trim()),
          });
        }

        const bill = parseFloat(values[3]?.trim() || "0");
        const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);

        await rpcClient.income.create({
          sessionId,
          date: values[0]?.trim() || new Date().toISOString().split("T")[0],
          room: values[1]?.trim() || "",
          name: values[2]?.trim() || "",
          bill,
          paid: totalPaid,
          paymentMethods,
        });
        successCount++;
      } catch (err) {
        errorCount++;
      }
    }

    alert(`Import complete: ${successCount} incomes added, ${errorCount} errors`);
    e.target.value = "";
    refetch();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">Admin Panel</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 dark:text-white">Create User</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center dark:text-gray-200">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="mr-2"
              />
              Admin
            </label>
          </div>
        </div>
        <button
          onClick={() => createUser({ username, password, isAdmin })}
          disabled={isPending || !username || !password}
          className="mt-2 bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create User"}
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 dark:text-white">Users</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Username</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Admin</th>
              <th className="border dark:border-gray-600 p-2 text-left dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border dark:border-gray-600 p-2 dark:text-gray-200">{user.username}</td>
                <td className="border dark:border-gray-600 p-2 dark:text-gray-200">{user.isAdmin ? "Yes" : "No"}</td>
                <td className="border dark:border-gray-600 p-2 dark:text-gray-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {editingUser && (
          <div className="mt-4 p-4 border border-blue-500 rounded-md dark:border-blue-400">
            <h4 className="text-md font-semibold mb-3 dark:text-white">
              Edit User: {editingUser.username}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter new password"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={editIsAdmin}
                    onChange={(e) => setEditIsAdmin(e.target.checked)}
                    className="mr-2"
                  />
                  Admin
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Update User"}
              </button>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setEditPassword("");
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 dark:text-white">Import CSV</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4">
            <h4 className="font-semibold mb-2 dark:text-white">Import Expenses</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload a CSV file with expenses. Download the template to see the required format.
            </p>
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleDownloadExpenseTemplate}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                Download Template
              </button>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportExpenseCSV}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            />
          </div>

          <div className="border border-gray-300 dark:border-gray-600 rounded-md p-4">
            <h4 className="font-semibold mb-2 dark:text-white">Import Income</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Upload a CSV file with income records. Download the template to see the required format.
            </p>
            <div className="flex gap-2 mb-2">
              <button
                onClick={handleDownloadIncomeTemplate}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
              >
                Download Template
              </button>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleImportIncomeCSV}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2 dark:text-white">Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Month</label>
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Category</label>
            <input
              type="text"
              value={exportCategory}
              onChange={(e) => setExportCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Reimbursed</label>
            <select
              value={
                exportReimbursed === undefined
                  ? ""
                  : exportReimbursed
                    ? "true"
                    : "false"
              }
              onChange={(e) =>
                setExportReimbursed(
                  e.target.value === ""
                    ? undefined
                    : e.target.value === "true"
                )
              }
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}
