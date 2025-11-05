import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { rpcClient } from "@/client/rpc-client";

interface UploadFormProps {
  sessionId: string;
  onSuccess?: () => void;
  editingExpense?: {
    id: string;
    date: string;
    amount: number;
    vat: number;
    category: string;
    purchaser: string;
    company: string;
    receiptPath?: string;
  };
}

export function UploadForm({ sessionId, onSuccess, editingExpense }: UploadFormProps) {
  const [date, setDate] = useState(editingExpense?.date || new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState(editingExpense?.amount.toString() || "");
  const [vat, setVat] = useState(editingExpense?.vat.toString() || "");
  const [category, setCategory] = useState(editingExpense?.category || "");
  const [purchaser, setPurchaser] = useState(editingExpense?.purchaser || "");
  const [company, setCompany] = useState(editingExpense?.company || "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => rpcClient.expenses.getCategories(),
  });

  const { mutate: createExpense, isPending: isCreating } = useMutation({
    mutationFn: async (data: {
      date: string;
      amount: number;
      vat: number;
      category: string;
      purchaser: string;
      company: string;
      receiptPath?: string;
    }) => {
      return rpcClient.expenses.create({ sessionId, ...data });
    },
    onSuccess: () => {
      setDate(new Date().toISOString().split("T")[0]);
      setAmount("");
      setVat("");
      setCategory("");
      setPurchaser("");
      setCompany("");
      setFile(null);
      if (onSuccess) onSuccess();
    },
  });

  const { mutate: updateExpense, isPending: isUpdating } = useMutation({
    mutationFn: async (data: {
      expenseId: string;
      date: string;
      amount: number;
      vat: number;
      category: string;
      purchaser: string;
      company: string;
      receiptPath?: string;
    }) => {
      return rpcClient.expenses.updateExpense({ sessionId, ...data });
    },
    onSuccess: () => {
      if (onSuccess) onSuccess();
    },
  });

  const isPending = isCreating || isUpdating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let receiptPath: string | undefined = editingExpense?.receiptPath;

    if (file) {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/uploads", {
          method: "POST",
          headers: { "x-session-id": sessionId },
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        receiptPath = data.path;
      } catch (err) {
        alert("Failed to upload receipt");
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const expenseData = {
      date,
      amount: parseFloat(amount),
      vat: parseFloat(vat),
      category,
      purchaser,
      company,
      receiptPath,
    };

    if (editingExpense) {
      updateExpense({
        expenseId: editingExpense.id,
        ...expenseData,
      });
    } else {
      createExpense(expenseData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 dark:text-white">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">VAT</label>
          <input
            type="number"
            step="0.01"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Category</label>
          <input
            type="text"
            list="categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
          <datalist id="categories">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Purchaser</label>
          <input
            type="text"
            value={purchaser}
            onChange={(e) => setPurchaser(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Receipt</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending || uploading}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : isPending ? (editingExpense ? "Updating..." : "Adding...") : (editingExpense ? "Update Expense" : "Add Expense")}
      </button>
    </form>
  );
}
