
import type { Metadata } from "next";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import StructuredData from "@/components/seo/structured-data";

export const metadata: Metadata = {
  title: "TreeHub - Professional Tree Care Network",
  description: "The professional hub for the tree care industry. Connect arborists, companies, and equipment suppliers nationwide.",
  keywords: "tree care, arborist, tree service, equipment marketplace, professional network, tree removal, tree trimming, emergency tree service",
  authors: [{ name: "TreeHub Team" }],
  metadataBase: new URL('https://treehub.app'),
  alternates: {
    canonical: 'https://treehub.app',
  },
  openGraph: {
    title: "TreeHub - Professional Tree Care Network",
    description: "Connect, grow, and succeed in the tree care industry",
    type: "website",
    locale: "en_US",
    url: "https://treehub.app",
    siteName: "TreeHub",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TreeHub - Professional Tree Care Network",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TreeHub - Professional Tree Care Network",
    description: "Connect, grow, and succeed in the tree care industry",
    site: "@treehub",
    creator: "@treehub",
    images: ["/twitter-image.jpg"],
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
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <StructuredData type="WebSite" />
        <StructuredData type="Organization" />
      </head>
      <body className="min-h-screen flex flex-col font-body antialiased">
        <AuthSessionProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
