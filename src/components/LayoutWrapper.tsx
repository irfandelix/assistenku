'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPortal = pathname?.startsWith('/p/');

  if (isPublicPortal) {
    return <main className="flex-1 w-full">{children}</main>;
  }

  return (
    <>
      <Navigation />
      <main className="flex-1 pb-20 md:pb-0 md:pl-72 p-4 md:pr-8 md:py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </>
  );
}
