'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function LoginCallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userStr = searchParams.get('user');

    if (token) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user?.organizationId) {
              localStorage.setItem('organizationId', user.organizationId);
            }
          } catch {
            // ignore
          }
        }
      }
    }

    router.replace('/');
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted">Redirecionando...</p>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted">Carregando...</p></div>}>
      <LoginCallbackPageContent />
    </Suspense>
  );
}
