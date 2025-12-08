import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals-fixed.css';
import { AuthProvider } from '@/lib/auth-context';
import { OSKernelProvider } from '@/lib/os-kernel-context';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: "DORCE — Connecting businesses & individuals across Nigeria",
  description: "Agent & Partner Network for Nigeria. Wallet (Paystack custody), VTU, Marketplace, and NIN/CAC agent services.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.className} font-sans os-body`}>
        <OSKernelProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </OSKernelProvider>
      </body>
    </html>
  );
}
