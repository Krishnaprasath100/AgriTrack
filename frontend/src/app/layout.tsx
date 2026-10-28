import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Noto Sans Tamil', 'sans-serif'],
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-heading',
  fallback: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'AgriTrack — Smart Agricultural Management Platform',
  description:
    'Complete farm management suite for tracking crop cycles, farming expenses, agricultural income, net profit, and historical records.',
  manifest: '/manifest.json',
  icons: {
    icon: '/images/icon.svg',
    apple: '/images/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AgriTrack',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1b4332',
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable}`}
      suppressHydrationWarning
      style={{ margin: 0, padding: 0 }}
    >
      <body
        className={inter.className}
        suppressHydrationWarning
        style={{ margin: 0, padding: 0 }}
      >
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
