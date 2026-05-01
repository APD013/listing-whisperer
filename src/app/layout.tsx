import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
import "./globals.css";
import GlobalChat from "./components/GlobalChat";
import Script from "next/script";
import { ThemeProvider } from "./lib/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Listing Whisperer — AI Assistant for Real Estate Agents",
  description: "The AI assistant that works with you before, during, and after every listing. Seller meeting prep, on-site photo drafts, and full marketing kits.",
  manifest: "/manifest.json",
  themeColor: "#1D9E75",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ListingWhisperer",
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
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{__html: `
          (function() {
            try {
              var theme = localStorage.getItem('lw_theme') || 'light';
              document.documentElement.setAttribute('data-theme', theme);
              if (theme === 'light') {
                document.documentElement.style.background = '#f4f5f7';
              } else {
                document.documentElement.style.background = '#111318';
              }
            } catch(e) {}
          })();
        `}}/>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-50NE5KHLE3"
          strategy="afterInteractive"
        />
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
              ttq.load('D7J82H3C77U8OVL7HCG0');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-50NE5KHLE3');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col" style={{fontFamily: 'var(--font-inter), sans-serif'}}>
        <ThemeProvider>
          {children}
          <GlobalChat />
        </ThemeProvider>
      </body>
    </html>
  );
}