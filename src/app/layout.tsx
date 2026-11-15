import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MediCore Hospital Management System",
  description:
    "Hospital management software for patient records, appointments, billing, pharmacy and inventory.",
  keywords: [
    "HMS",
    "Hospital Management System",
    "EMR",
    "EHR",
    "Healthcare",
    "Clinical Workflow",
    "OPD",
    "IPD",
    "Pharmacy",
  ],
  authors: [{ name: "MediCore Systems" }],
  icons: {
    icon: "/favicon.ico",
  },
};

// Inline script: applies persisted theme BEFORE React hydrates, preventing
// a flash of the wrong theme.
const themeBootstrap = `
(function(){
  try {
    var raw = localStorage.getItem('medicore-theme');
    var mode = raw ? JSON.parse(raw).mode : 'light';
    var root = document.documentElement;
    if (mode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
