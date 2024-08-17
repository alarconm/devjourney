"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ColorPalette, colorPalettes } from '@/lib/colorPalettes';

type ColorPaletteContextType = {
  currentPalette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
};

const ColorPaletteContext = createContext<ColorPaletteContextType | undefined>(undefined);

export const ColorPaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>('default');

  useEffect(() => {
    const savedPalette = localStorage.getItem('colorPalette') as ColorPalette;
    if (savedPalette && colorPalettes[savedPalette]) {
      setCurrentPalette(savedPalette);
      applyPalette(savedPalette);
    } else {
      applyPalette('default');
    }
  }, []);

  const applyPalette = (palette: ColorPalette) => {
    Object.entries(colorPalettes[palette]).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
  };

  const setPalette = (palette: ColorPalette) => {
    setCurrentPalette(palette);
    applyPalette(palette);
    localStorage.setItem('colorPalette', palette);
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