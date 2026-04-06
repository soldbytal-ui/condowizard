import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatWidget from '@/components/chat/ChatWidget';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://condowizard.ca'),
  title: {
    default: 'Pre-Construction Condos in Toronto | CondoWizard.ca',
    template: '%s | CondoWizard.ca',
  },
  description: 'Access 200+ pre-construction condo developments across Toronto and the Greater Toronto Area. From $400K to $5M+. King West, Yorkville, Downtown Core & more.',
  alternates: {
    canonical: 'https://condowizard.ca',
  },
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: 'https://condowizard.ca',
    siteName: 'CondoWizard.ca',
    title: 'Pre-Construction Condos in Toronto | CondoWizard.ca',
    description: 'Access 200+ pre-construction condo developments across Toronto and the Greater Toronto Area.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CondoWizard.ca - Toronto Pre-Construction Condo Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pre-Construction Condos in Toronto | CondoWizard.ca',
    description: 'Access 200+ pre-construction condo developments across Toronto and the Greater Toronto Area.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0066FF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-bg text-text-primary">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}
