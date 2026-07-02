import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://website-roast.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Website Roast — Brutally Honest AI Website Reviews",
    template: "%s | Website Roast",
  },
  description:
    "Paste any URL and get a brutally honest, technically accurate roast of its design, UX, SEO, performance, accessibility, and conversion — with a 0–100 score and a full improvement report.",
  keywords: [
    "website review",
    "website audit",
    "website roast",
    "SEO audit",
    "UX review",
    "accessibility audit",
    "performance audit",
    "AI website analyzer",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Website Roast — Brutally Honest AI Website Reviews",
    description:
      "If Simon Cowell reviewed websites. Paste a URL, get roasted, get better.",
    siteName: "Website Roast",
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Roast — Brutally Honest AI Website Reviews",
    description:
      "If Simon Cowell reviewed websites. Paste a URL, get roasted, get better.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
