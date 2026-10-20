import type { Metadata, Viewport } from 'next';
import { Instrument_Sans, Noto_Serif_Display, Noto_Serif_Thai } from 'next/font/google';
import './globals.css';

// numbers and headlines: a light display serif; text: a plain grotesk; the Thai wordmark: Noto Serif Thai
const serif = Noto_Serif_Display({ subsets: ['latin'], weight: ['200', '300'], variable: '--font-serif', display: 'swap' });
const sans = Instrument_Sans({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-sans', display: 'swap' });
const thai = Noto_Serif_Thai({ subsets: ['thai', 'latin'], weight: ['300', '500'], variable: '--font-thai', display: 'swap' });

export const metadata: Metadata = {
  title: 'Ron Yen · Sauna and ice bath, Ari, Bangkok',
  description: 'A social sauna at 88° and two ice baths at 3°, on Soi Ari 7. Seventy-five minute sessions, ten on the bench.',
};

export const viewport: Viewport = {
  themeColor: '#170905',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${thai.variable}`}>
      <body>{children}</body>
    </html>
  );
}
