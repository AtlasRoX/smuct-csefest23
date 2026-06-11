import type { Metadata } from "next";
import { Agentation } from "agentation";
import { Space_Grotesk, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://csefest2026.smuct.edu.bd";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CSE Fest 2026 — SMUCT Technology Festival",
    template: "%s | CSE Fest 2026",
  },
  description:
    "The official management platform for CSE Fest 2026 at Shanto-Mariam University of Creative Technology. Register teams, submit proposals, track results, and showcase innovation.",
  keywords: [
    "CSE Fest",
    "SMUCT",
    "technology festival",
    "hackathon",
    "competitive programming",
    "CSE competition",
    "Bangladesh tech fest",
  ],
  authors: [{ name: "CSE & CSIT Department, SMUCT" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    url: SITE_URL,
    siteName: "CSE Fest 2026",
    title: "CSE Fest 2026 — SMUCT Technology Festival",
    description:
      "Join Bangladesh's premier university technology festival. Compete in Software Showcase, IoT, Datathon, CTF, Robo Soccer, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CSE Fest 2026 — SMUCT Technology Festival",
    description:
      "Join Bangladesh's premier university technology festival — July 18, 2026.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full bg-neutral-950 text-neutral-50 font-sans antialiased flex flex-col" suppressHydrationWarning>
        {children}
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
