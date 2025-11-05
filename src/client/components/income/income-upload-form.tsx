import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { rpcClient } from "@/client/rpc-client";

interface IncomeUploadFormProps {
  sessionId: string;
  onSuccess?: () => void;
  editingIncome?: {
    id: string;
    date: string;
    room: string;
    name: string;
    bill: number;
    paid: number;
    paymentMethods: { type: string; amount: number; wechatCNY?: string }[];
  };
}

const ROOMS = ["K1", "K2", "K3", "K4", "K5", "K6", "K7", "K8", "K9", "K10", "Bar"];
const DEFAULT_PAYMENT_TYPES = ["Cash", "Card", "WeChat", "Credit"];

export function IncomeUploadForm({ sessionId, onSuccess, editingIncome }: IncomeUploadFormProps) {
  const [date, setDate] = useState(editingIncome?.date || new Date().toISOString().split("T")[0]);
  const [room, setRoom] = useState(editingIncome?.room || "");
  const [name, setName] = useState(editingIncome?.name || "");
  const [bill, setBill] = useState(editingIncome?.bill.toString() || "");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<{ type: string; amount: number; wechatCNY?: string }[]>(
    editingIncome?.paymentMethods || []
  );
  const [customPaymentTypes, setCustomPaymentTypes] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const allPaymentTypes = [...DEFAULT_PAYMENT_TYPES, ...customPaymentTypes];

  const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);

  const { mutate: createIncome, isPending: isCreating } = useMutation({
    mutationFn: async (data: {
      date: string;
      room: string;
      name: string;
      bill: number;
      paid: number;
      paymentMethods: { type: string; amount: number; wechatCNY?: string }[];
    }) => {
      return rpcClient.income.create({ sessionId, ...data });
    },
    onSuccess: () => {
      setDate(new Date().toISOString().split("T")[0]);
      setRoom("");
      setName("");
      setBill("");
      setPaymentMethods([]);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      if (onSuccess) onSuccess();
    },
  });

  const { mutate: updateIncome, isPending: isUpdating } = useMutation({
    mutationFn: async (data: {
      incomeId: string;
      paid: number;
      paymentMethods: { type: string; amount: number; wechatCNY?: string }[];
    }) => {
      return rpcClient.income.update({ sessionId, ...data });
    },
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      if (onSuccess) onSuccess();
    },
  });

  const isPending = isCreating || isUpdating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingIncome) {
      updateIncome({
        incomeId: editingIncome.id,
        paid: totalPaid,
        paymentMethods,
      });
    } else {
      createIncome({
        date,
        room,
        name,
        bill: parseFloat(bill),
        paid: totalPaid,
        paymentMethods,
      });
    }
  };

  const outstanding = bill ? parseFloat(bill) - totalPaid : 0;

  const addPaymentMethod = (type: string, amount: string, wechatCNY?: string) => {
    const amountNum = parseFloat(amount);
    if (amountNum > 0) {
      setPaymentMethods([...paymentMethods, { type, amount: amountNum, wechatCNY }]);
    }
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const addCustomPaymentType = (type: string) => {
    if (type && !allPaymentTypes.includes(type)) {
      setCustomPaymentTypes([...customPaymentTypes, type]);
    }
  };

  return (
    <>
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-md shadow-lg z-50">
          Income {editingIncome ? 'updated' : 'added'} successfully!
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 dark:text-white">{editingIncome ? 'Edit Income' : 'Add Income'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={!!editingIncome}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Room</label>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={!!editingIncome}
            >
              <option value="">Select Room</option>
              {ROOMS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={!!editingIncome}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Bill</label>
            <input
              type="number"
              step="0.01"
              value={bill}
              onChange={(e) => setBill(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
              disabled={!!editingIncome}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Paid</label>
            <input
              type="number"
              step="0.01"
              value={totalPaid.toFixed(2)}
              readOnly
              className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Outstanding</label>
            <input
              type="number"
              step="0.01"
              value={outstanding.toFixed(2)}
              readOnly
              className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Payment Methods</label>
          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Add Payment Method ({paymentMethods.length})
          </button>
          {paymentMethods.length > 0 && (
            <div className="mt-2 space-y-1">
              {paymentMethods.map((pm, idx) => (
                <div key={idx} className="flex items-center gap-2 dark:text-gray-200">
                  <span>
                    {pm.type}: £{pm.amount.toFixed(2)}
                    {pm.wechatCNY && ` (${pm.wechatCNY})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePaymentMethod(idx)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending || paymentMethods.length === 0}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? (editingIncome ? "Updating..." : "Adding...") : (editingIncome ? "Update Income" : "Add Income")}
        </button>
      </form>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Add Payment Method</h3>
            {allPaymentTypes.map((type) => (
              <div key={type} className="mb-3">
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">{type}</label>
                <div className="flex gap-2 flex-col">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    id={`payment-${type}`}
                    className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  {type === "WeChat" && (
                    <input
                      type="text"
                      placeholder="CNY"
                      id={`payment-${type}-cny`}
                      className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(`payment-${type}`) as HTMLInputElement;
                      const cnyInput = document.getElementById(`payment-${type}-cny`) as HTMLInputElement;
                      if (input.value) {
                        addPaymentMethod(type, input.value, type === "WeChat" ? cnyInput?.value : undefined);
                        input.value = "";
                        if (cnyInput) cnyInput.value = "";
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-4 border-t dark:border-gray-600">
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Custom Payment Type</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New payment type"
                  id="custom-payment-type"
                  className="flex-1 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById("custom-payment-type") as HTMLInputElement;
                    if (input.value) {
                      addCustomPaymentType(input.value);
                      input.value = "";
                    }
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Add Type
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowPaymentModal(false)}
              className="mt-4 w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
