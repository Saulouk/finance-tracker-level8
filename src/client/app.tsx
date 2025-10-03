import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { rpcClient } from "@/client/rpc-client";
import { Login } from "./components/auth/login";
import { AddExpensePage } from "./pages/add-expense";
import { ExpenseHistoryPage } from "./pages/expense-history";
import { AdminPage } from "./pages/admin";

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
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow mb-6">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-4">
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
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/add"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Add Expense
              </Link>
              <Link
                to="/history"
                className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700"
              >
                Expense History
              </Link>
              {user.isAdmin && (
                <Link
                  to="/admin"
                  className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4">
          <Routes>
            <Route path="/" element={<Navigate to="/add" replace />} />
            <Route
              path="/add"
              element={<AddExpensePage sessionId={sessionId} />}
            />
            <Route
              path="/history"
              element={
                <ExpenseHistoryPage
                  sessionId={sessionId}
                  isAdmin={user.isAdmin}
                />
              }
            />
            {user.isAdmin && (
              <Route
                path="/admin"
                element={<AdminPage sessionId={sessionId} />}
              />
            )}
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
