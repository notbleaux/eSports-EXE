import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eSports-EXE | DARE TO WEAR",
  description: "Gaming hub with NASA Mission Control aesthetic - eSports statistics, tournaments, and player ratings",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
