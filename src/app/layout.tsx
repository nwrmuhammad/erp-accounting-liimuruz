import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Accounting SaaS', template: '%s | Accounting SaaS' },
  description: 'Multi-branch accounting & analytics platform',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={`${poppins.variable} font-sans min-h-screen antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
