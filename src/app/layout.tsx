import type { Metadata } from "next";
import { Inter } from "next/font/google";
import './globals.css';
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import ClientOnly from '@/components/ClientOnly'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevJourney Helper App",
  description: "Track your development journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            <div className="flex justify-end p-4">
              <ThemeToggle />
            </div>
            <ClientOnly>{children}</ClientOnly>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}