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

  const { data: users = [] } = useQuery({
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
    },
  });

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

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Create User</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
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
        <h3 className="text-lg font-semibold mb-2">Users</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Username</th>
              <th className="border p-2 text-left">Admin</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border p-2">{user.username}</td>
                <td className="border p-2">{user.isAdmin ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <input
              type="month"
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <input
              type="text"
              value={exportCategory}
              onChange={(e) => setExportCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reimbursed</label>
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
              className="w-full px-3 py-2 border rounded-md"
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
