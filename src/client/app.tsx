import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { rpcClient } from "@/client/rpc-client";
import { Login } from "./components/auth/login";
import { AddIncomePage } from "./pages/add-income";
import { IncomeHistoryPage } from "./pages/income-history";
import { AddExpensePage } from "./pages/add-expense";
import { ExpenseHistoryPage } from "./pages/expense-history";
import { BalancesPage } from "./pages/balances";
import { AdminPage } from "./pages/admin";

function App() {
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem("sessionId");
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    console.log('Dark mode changed:', darkMode);
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
    console.log('Classes on html:', document.documentElement.className);
  }, [darkMode]);

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
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-xl dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!sessionId || !user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 shadow mb-6">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold dark:text-white">Expense Tracker</h1>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {darkMode ? "🌞" : "🌙"}
                </button>
                <span className="text-gray-600 dark:text-gray-300">
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
                to="/add-income"
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
              >
                Add Income
              </Link>
              <Link
                to="/income-history"
                className="px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700"
              >
                Income History
              </Link>
              <Link
                to="/add-expense"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Add Expense
              </Link>
              <Link
                to="/expense-history"
                className="px-4 py-2 rounded-md bg-gray-600 text-white hover:bg-gray-700"
              >
                Expense History
              </Link>
              <Link
                to="/balances"
                className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Balances
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
            <Route path="/" element={<Navigate to="/add-income" replace />} />
            <Route
              path="/add-income"
              element={<AddIncomePage sessionId={sessionId} />}
            />
            <Route
              path="/income-history"
              element={
                <IncomeHistoryPage
                  sessionId={sessionId}
                  isAdmin={user.isAdmin}
                />
              }
            />
            <Route
              path="/add-expense"
              element={<AddExpensePage sessionId={sessionId} />}
            />
            <Route
              path="/expense-history"
              element={
                <ExpenseHistoryPage
                  sessionId={sessionId}
                  isAdmin={user.isAdmin}
                />
              }
            />
            <Route
              path="/balances"
              element={
                <BalancesPage
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
