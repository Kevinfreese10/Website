"use client";

import React, { useState, useEffect } from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [color, setColor] = useState(value || "#000000");

  useEffect(() => {
    if (value && value !== color) {
      setColor(value);
    }
  }, [value]);

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setColor(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      onChange(val);
    }
  };

  return (
    <div className={cn("flex items-center gap-0 overflow-hidden border rounded-md focus-within:ring-2 focus-within:ring-primary/20 bg-background shadow-sm h-9", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-12 h-full border-r bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center shrink-0 outline-none"
          >
            <div
              className="w-6 h-6 rounded-md shadow-sm border border-black/10"
              style={{ backgroundColor: color }}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="space-y-3">
            <HexColorPicker color={color} onChange={handleColorChange} />
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Hex</span>
              <Input
                value={color}
                onChange={handleInputChange}
                className="h-8 text-xs font-mono uppercase"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Input
        value={color}
        onChange={handleInputChange}
        className="border-0 h-full text-xs font-mono uppercase focus-visible:ring-0 focus-visible:ring-offset-0 px-3 bg-transparent flex-grow"
        placeholder="#000000"
      />
    </div>
  );
}
