import type { Metadata, Viewport } from 'next';
import { Athiti, Instrument_Sans, Noto_Serif_Display, Noto_Serif_Thai } from 'next/font/google';
import 'lenis/dist/lenis.css';
import './globals.css';

// numbers and headlines: a light display serif; text: a plain grotesk; Thai text: Noto Serif Thai;
// the Thai wordmark: Athiti, modern and without loops
const serif = Noto_Serif_Display({ subsets: ['latin'], weight: ['200', '300'], variable: '--font-serif', display: 'swap' });
const sans = Instrument_Sans({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-sans', display: 'swap' });
const thai = Noto_Serif_Thai({ subsets: ['thai', 'latin'], weight: ['300', '500'], variable: '--font-thai', display: 'swap' });
const mark = Athiti({ subsets: ['thai'], weight: '600', variable: '--font-mark', display: 'swap' });

// The share image (app/opengraph-image.jpg, twitter-image.jpg) is the first view itself, shot at 1200×630
// just after the glass has wiped clear. On Vercel the links resolve against the deployment's own address.
const title = 'Ron Yen · Sauna and ice bath, Ari, Bangkok';
const description = 'A social sauna at 88° and four ice baths at 3°, on Soi Ari, Bangkok. Seventy-five minute sessions, ten on the bench, five minutes from BTS Ari.';
export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: 'website', siteName: 'Ron Yen', locale: 'en_GB' },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport: Viewport = {
  themeColor: '#170905',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${thai.variable} ${mark.variable}`}>
      <body>{children}</body>
    </html>
  );
}
