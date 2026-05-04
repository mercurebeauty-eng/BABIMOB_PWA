'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function NotificationProvider() {
  return (
    <SonnerToaster
      position="top-center"
      expand={false}
      richColors
      closeButton
      theme="dark"
      toastOptions={{
        style: {
          background: 'var(--ink)',
          border: '1px solid var(--line)',
          color: 'var(--cream)',
          borderRadius: '16px',
          fontFamily: 'inherit',
        },
      }}
    />
  );
}
