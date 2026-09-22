"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, endOfDay, parseISO, isValid } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: DateRange;
  onDateChange: (date: DateRange | undefined) => void;
  financialYearEnd?: string; // e.g., "February"
}

export function DateRangePicker({
  className,
  value,
  onDateChange,
  financialYearEnd,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(value);
  const [preset, setPreset] = React.useState<string>(() => value ? "this_year" : "all");

  React.useEffect(() => {
    const isDifferent = (value?.from?.getTime() !== date?.from?.getTime()) || (value?.to?.getTime() !== date?.to?.getTime());
    if (isDifferent) {
      setDate(value);
      if (!value) {
        setPreset("all");
      } else {
        setPreset("custom");
      }
    }
  }, [value]);

  React.useEffect(() => {
    onDateChange(date);
  }, [date, onDateChange]);

  const handlePresetChange = (presetValue: string) => {
    setPreset(presetValue);
    const now = new Date();
    let newDate: DateRange | undefined = undefined;

    const getFinancialYear = (dateObj: Date, endMonthName?: string) => {
        const endMonth = endMonthName ? new Date(`${endMonthName} 1, 2000`).getMonth() : 1; // Default to Feb if not provided
        const currentMonth = dateObj.getMonth();
        let year = dateObj.getFullYear();

        if (currentMonth > endMonth) {
            return {
                start: new Date(year, endMonth + 1, 1),
                end: endOfDay(new Date(year + 1, endMonth, new Date(year + 1, endMonth + 1, 0).getDate())),
            };
        } else {
             return {
                start: new Date(year - 1, endMonth + 1, 1),
                end: endOfDay(new Date(year, endMonth, new Date(year, endMonth + 1, 0).getDate())),
            };
        }
    };
    
    const lastFinancialYear = (dateObj: Date, endMonthName?: string) => {
        const { start } = getFinancialYear(dateObj, endMonthName);
        const lastYearStart = new Date(start);
        lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
        const lastYearEnd = new Date(start);
        lastYearEnd.setDate(lastYearEnd.getDate() - 1);
        return { from: lastYearStart, to: endOfDay(lastYearEnd) };
    };

    switch (presetValue) {
      case "all":
        newDate = undefined;
        break;
      case "this_month":
        newDate = { from: startOfMonth(now), to: endOfDay(endOfMonth(now)) };
        break;
      case "this_year":
        const { start, end } = getFinancialYear(now, financialYearEnd);
        newDate = { from: start, to: end };
        break;
      case "last_year":
        newDate = lastFinancialYear(now, financialYearEnd);
        break;
      case "custom":
        if (!date) {
            newDate = { from: startOfMonth(now), to: endOfDay(endOfMonth(now)) };
        } else {
            newDate = date;
        }
        break;
    }
    setDate(newDate);
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (!val) {
          setDate(prev => ({ from: undefined, to: prev?.to }));
          return;
      }
      const parsed = parseISO(val);
      if (isValid(parsed)) {
          setDate(prev => ({ from: parsed, to: prev?.to }));
      }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (!val) {
          setDate(prev => ({ from: prev?.from, to: undefined }));
          return;
      }
      const parsed = parseISO(val);
      if (isValid(parsed)) {
          setDate(prev => ({ from: prev?.from, to: endOfDay(parsed) }));
      }
  };

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
        <Select value={preset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-10 w-full bg-white shadow-sm">
                <SelectValue placeholder="Select a date range" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="this_year">This Financial Year</SelectItem>
                <SelectItem value="last_year">Last Financial Year</SelectItem>
                <SelectItem value="custom">Custom Dates</SelectItem>
            </SelectContent>
        </Select>
        
        {preset === "custom" && (
            <div className="grid grid-cols-2 gap-2 w-full animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                    type="date"
                    id="date-from"
                    value={date?.from ? format(date.from, "yyyy-MM-dd") : ""}
                    onChange={handleFromChange}
                    placeholder="From"
                    className={cn("w-full h-10 bg-white text-sm shadow-sm", !date?.from && "text-muted-foreground")}
                />
                <Input
                    type="date"
                    id="date-to"
                    value={date?.to ? format(date.to, "yyyy-MM-dd") : ""}
                    onChange={handleToChange}
                    placeholder="To"
                    className={cn("w-full h-10 bg-white text-sm shadow-sm", !date?.to && "text-muted-foreground")}
                />
            </div>
        )}
    </div>
  )
}
