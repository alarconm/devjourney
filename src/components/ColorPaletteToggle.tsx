"use client"

import * as React from "react"
import { Palette } from "lucide-react"
import { useColorPalette } from "@/app/context/ColorPaletteContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { colorPalettes, ColorPalette } from "@/lib/colorPalettes"

export function ColorPaletteToggle() {
  const { currentPalette, setPalette } = useColorPalette()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Palette className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle color palette</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Object.keys(colorPalettes).map((palette) => (
          <DropdownMenuItem
            key={palette}
            onClick={() => setPalette(palette as ColorPalette)}
          >
            {palette}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}