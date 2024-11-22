import { FallbackProps } from 'react-error-boundary';

export const FallbackComponent = ({ error }: FallbackProps) => {
  return (
    <div className="min-h-screen bg-crypto-dark flex items-center justify-center">
      <div className="max-w-xl p-6 bg-crypto-dark/50 rounded-xl border border-crypto-primary/10">
        <h2 className="text-2xl font-bold text-crypto-primary mb-4">Something went wrong</h2>
        <pre className="text-sm text-red-500 overflow-auto">
          {error.message}
        </pre>
      </div>
    </div>
  );
};