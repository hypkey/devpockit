import { AppLayout } from '@/components/layout/AppLayout'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import type { Metadata, Viewport } from 'next'
import { DM_Serif_Text, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

const dmSerifText = DM_Serif_Text({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-dm-serif',
})

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://devpockit.hypkey.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'DevPockit - Free Online Developer Tools',
    template: '%s | DevPockit',
  },
  description:
    'Free online developer tools that run locally in your browser. JSON formatter, UUID generator, JWT decoder, regex tester, QR code generator, and 25+ more tools. Fast, private, no sign-up required.',
  keywords: [
    // Primary keywords
    'developer tools',
    'online dev tools',
    'free developer tools',
    'web developer tools',
    // Tool-specific keywords
    'json formatter',
    'json beautifier',
    'uuid generator',
    'jwt decoder',
    'jwt encoder',
    'regex tester',
    'qr code generator',
    'base64 encoder',
    'url encoder decoder',
    'cron expression parser',
    'timestamp converter',
    'xml formatter',
    'yaml converter',
    'hash generator',
    'cidr calculator',
    'diff checker',
    'lorem ipsum generator',
    // Feature keywords
    'browser-based tools',
    'privacy-focused',
    'no sign-up',
    'offline capable',
  ],
  authors: [{ name: 'DevPockit Team' }],
  creator: 'DevPockit',
  publisher: 'DevPockit',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${baseUrl}/`,
    siteName: 'DevPockit',
    title: 'DevPockit - Free Online Developer Tools',
    description:
      'Free online developer tools that run locally in your browser. JSON formatter, UUID generator, JWT decoder, and 25+ more tools. Fast, private, no sign-up.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DevPockit - Developer Tools',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevPockit - Free Online Developer Tools',
    description:
      'Free developer tools in your browser. JSON formatter, UUID generator, JWT decoder & more. Private, fast, no sign-up.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: `${baseUrl}/`,
  },
  category: 'technology',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${dmSerifText.variable}`}>
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
