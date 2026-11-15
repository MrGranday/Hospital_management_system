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
// a flash of the wrong theme/accent.
const themeBootstrap = `
(function(){
  try {
    var raw = localStorage.getItem('medicore-theme');
    var prefs = raw ? JSON.parse(raw) : { mode: 'light', accent: 'blue', radius: 'md', density: 'comfortable' };
    var root = document.documentElement;
    var accentHues = { blue:245, emerald:155, violet:290, rose:15, amber:75, cyan:200, teal:180, indigo:265 };
    var h = accentHues[prefs.accent] || 245;
    var shades = [[50,0.978,0.012],[100,0.953,0.024],[200,0.910,0.046],[300,0.855,0.078],[400,0.780,0.115],[500,0.690,0.150],[600,0.608,0.180],[700,0.535,0.195],[800,0.445,0.175],[900,0.385,0.140],[950,0.305,0.100]];
    for (var i = 0; i < shades.length; i++) {
      var s = shades[i];
      root.style.setProperty('--color-brand-' + s[0], 'oklch(' + s[1] + ' ' + s[2] + ' ' + h + ')');
    }
    root.style.setProperty('--primary', 'oklch(0.608 0.180 ' + h + ')');
    root.style.setProperty('--ring', 'oklch(0.608 0.180 ' + h + ')');
    root.style.setProperty('--sidebar-primary', 'oklch(0.608 0.180 ' + h + ')');
    root.style.setProperty('--sidebar-ring', 'oklch(0.608 0.180 ' + h + ')');
    var radiusMap = { none:'0px', sm:'0.375rem', md:'0.75rem', lg:'1rem' };
    root.style.setProperty('--radius', radiusMap[prefs.radius] || '0.75rem');
    var densityMap = { compact:'0.9375rem', comfortable:'1rem', spacious:'1.0625rem' };
    root.style.setProperty('--app-density-base', densityMap[prefs.density] || '1rem');
    var mode = prefs.mode === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : prefs.mode;
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
