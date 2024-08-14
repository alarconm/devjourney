"use client"

import React, { createContext, useContext, useState } from 'react';
import { ColorPalette, colorPalettes } from '@/lib/colorPalettes';

type ColorPaletteContextType = {
  currentPalette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
};

const ColorPaletteContext = createContext<ColorPaletteContextType | undefined>(undefined);

export const ColorPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>('default');

  const setPalette = (palette: ColorPalette) => {
    setCurrentPalette(palette);
    Object.entries(colorPalettes[palette]).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
    // Update the theme based on the palette
    if (palette === 'cyberpink' || palette === 'midnight' || palette === 'neon' || palette === 'cyberblue' || palette === 'galaxy') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <ColorPaletteContext.Provider value={{ currentPalette, setPalette }}>
      {children}
    </ColorPaletteContext.Provider>
  );
};

export const useColorPalette = () => {
  const context = useContext(ColorPaletteContext);
  if (context === undefined) {
    throw new Error('useColorPalette must be used within a ColorPaletteProvider');
  }
  return context;
};