import React from 'react'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import './globals.css';
import { AppProvider } from './context/AppContext'
import { ThemeProvider } from "@/components/theme-provider"
import { ColorPaletteToggle } from "@/components/ColorPaletteToggle"
import ClientOnly from '@/components/ClientOnly'
import { ColorPaletteProvider } from './context/ColorPaletteContext'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevJourney Helper App",
  description: "Track your development journey",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ColorPaletteProvider>
          <AppProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
            </ThemeProvider>
          </AppProvider>
        </ColorPaletteProvider>
      </body>
    </html>
  )
}