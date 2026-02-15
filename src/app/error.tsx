'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('TalentOS app error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-border-default bg-surface p-8 text-center">
      <h2 className="text-lg font-semibold text-foreground-secondary">Algo deu errado</h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        Ocorreu um erro ao carregar esta página. Tente novamente.
      </p>
      {process.env.NODE_ENV === 'development' && error?.message && (
        <pre className="mt-4 max-h-32 overflow-auto rounded bg-background px-3 py-2 text-left text-xs text-red-400">
          {error.message}
        </pre>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  );
}
