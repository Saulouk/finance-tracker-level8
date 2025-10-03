import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { rpcClient } from "@/client/rpc-client";
import { Login } from "./components/auth/login";
import { UploadForm } from "./components/expenses/upload-form";
import { ExpenseTable } from "./components/expenses/expense-table";
import { AdminPanel } from "./components/admin/admin-panel";

function App() {
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem("sessionId");
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser", sessionId],
    queryFn: () => rpcClient.auth.getCurrentUser(sessionId || undefined),
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("sessionId", sessionId);
    } else {
      localStorage.removeItem("sessionId");
    }
  }, [sessionId]);

  const handleLogin = (
    newSessionId: string,
    userData: { id: string; username: string; isAdmin: boolean }
  ) => {
    setSessionId(newSessionId);
  };

  const handleLogout = async () => {
    if (sessionId) {
      await rpcClient.auth.logout(sessionId);
      setSessionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!sessionId || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Expense Tracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {user.username} {user.isAdmin && "(Admin)"}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4">
        {user.isAdmin && <AdminPanel sessionId={sessionId} />}
        <UploadForm sessionId={sessionId} />
        <ExpenseTable sessionId={sessionId} isAdmin={user.isAdmin} />
      </div>
    </div>
  );
}

export default App;
