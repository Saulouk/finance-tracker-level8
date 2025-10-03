import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { rpcClient } from "@/client/rpc-client";

interface UploadFormProps {
  sessionId: string;
  onSuccess?: () => void;
}

export function UploadForm({ sessionId, onSuccess }: UploadFormProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [vat, setVat] = useState("");
  const [category, setCategory] = useState("");
  const [purchaser, setPurchaser] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => rpcClient.expenses.getCategories(),
  });

  const { mutate: createExpense, isPending } = useMutation({
    mutationFn: async (data: {
      date: string;
      amount: number;
      vat: number;
      category: string;
      purchaser: string;
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
      setFile(null);
      if (onSuccess) onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let receiptPath: string | undefined;

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

    createExpense({
      date,
      amount: parseFloat(amount),
      vat: parseFloat(vat),
      category,
      purchaser,
      receiptPath,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Add Expense</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">VAT</label>
          <input
            type="number"
            step="0.01"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            type="text"
            list="categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <datalist id="categories">
            {categories.map((cat) => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Purchaser</label>
          <input
            type="text"
            value={purchaser}
            onChange={(e) => setPurchaser(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Receipt</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending || uploading}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : isPending ? "Adding..." : "Add Expense"}
      </button>
    </form>
  );
}
