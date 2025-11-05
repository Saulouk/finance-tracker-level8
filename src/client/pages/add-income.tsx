import { IncomeUploadForm } from "@/client/components/income/income-upload-form";

interface AddIncomePageProps {
  sessionId: string;
}

export function AddIncomePage({ sessionId }: AddIncomePageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Add Income</h1>
      <IncomeUploadForm sessionId={sessionId} />
    </div>
  );
}
