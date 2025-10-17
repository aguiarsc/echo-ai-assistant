import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/application/theme-management/next-themes-provider";
import { ThemeProvider as CustomThemeProvider } from "@/application/theme-management/custom-theme-provider";
import { Toaster } from "@/shared/ui-components/sonner";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { ClientErrorHandler } from "@/shared/components/ClientErrorHandler";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Echo",
  description: "Echo - An advanced, Gemini based, AI assistant with file system capabilities",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientErrorHandler />
        <CustomThemeProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            <Toaster position="top-center" />
          </ThemeProvider>
        </CustomThemeProvider>
      </body>
    </html>
  );
}
