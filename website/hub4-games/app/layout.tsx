import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Nexus | NJZ ¿!? Games Hub',
  description: 'The Nexus - Where offline strategy meets live competition. Download NJZ Manager, explore game modes, and compete on the live platform.',
  keywords: ['NJZ', 'Games Hub', 'eSports', 'Management Simulation', 'Live Platform'],
  authors: [{ name: 'NJZ Platform' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('SW registered:', reg.scope))
                .catch(err => console.log('SW failed:', err));
            });
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
