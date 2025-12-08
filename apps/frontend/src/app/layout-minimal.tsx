import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: "Dorce.ai - Your AI Financial Assistant",
  description: "AI-powered financial assistant for Africa - chat naturally to buy airtime, pay bills, and manage your wallet",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
      <body className={`${inter.className} font-sans`}>
        {children}
      </body>
    </html>
  );
}