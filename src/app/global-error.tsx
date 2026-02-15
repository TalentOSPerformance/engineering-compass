'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('TalentOS global error:', error);
  }, [error]);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased flex items-center justify-center p-6">
        <div className="max-w-md rounded-xl border border-border-default bg-surface p-8 text-center">
          <h1 className="text-xl font-bold text-foreground-secondary">Erro interno</h1>
          <p className="mt-2 text-sm text-muted">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          {process.env.NODE_ENV === 'development' && error?.message && (
            <pre className="mt-4 max-h-40 overflow-auto rounded bg-background p-3 text-left text-xs text-red-400">
              {error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          >
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
