'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPortal = pathname?.startsWith('/p/') || pathname?.startsWith('/c/');

  if (isPublicPortal) {
    return <main className="flex-1 w-full">{children}</main>;
  }

  const isFullWidthPage = pathname?.startsWith('/consultants');

  return (
    <>
      <Navigation />
      <main className={`flex-1 min-h-screen pb-24 md:pb-8 md:pl-24 w-full bg-[#07090E] ${isFullWidthPage ? '' : 'p-4 md:px-8 md:py-8 max-w-7xl mx-auto'}`}>
        {children}
      </main>
    </>
  );
}
