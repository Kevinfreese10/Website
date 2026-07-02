"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, getMonth, endOfDay, parse, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  const [preset, setPreset] = React.useState<string>("all");
  
  const [fromText, setFromText] = React.useState<string>(value?.from ? format(value.from, "dd/MM/yyyy") : "");
  const [toText, setToText] = React.useState<string>(value?.to ? format(value.to, "dd/MM/yyyy") : "");

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
    setFromText(date?.from ? format(date.from, "dd/MM/yyyy") : "");
    setToText(date?.to ? format(date.to, "dd/MM/yyyy") : "");
  }, [date, onDateChange]);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const now = new Date();
    let newDate: DateRange | undefined = undefined;

    const getFinancialYear = (date: Date, endMonthName?: string) => {
        const endMonth = endMonthName ? new Date(`${endMonthName} 1, 2000`).getMonth() : 1; // Default to Feb if not provided
        const currentMonth = date.getMonth();
        let year = date.getFullYear();

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
    
    const lastFinancialYear = (date: Date, endMonthName?: string) => {
        const { start } = getFinancialYear(date, endMonthName);
        const lastYearStart = new Date(start);
        lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
        const lastYearEnd = new Date(start);
        lastYearEnd.setDate(lastYearEnd.getDate() - 1);
        return { from: lastYearStart, to: endOfDay(lastYearEnd) };
    };

    switch (value) {
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

  const handleFromBlur = () => {
      if (!fromText) {
          setDate(prev => ({ from: undefined, to: prev?.to }));
          return;
      }
      const parsed = parse(fromText, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
          setDate(prev => ({ from: parsed, to: prev?.to }));
      } else {
          setFromText(date?.from ? format(date.from, "dd/MM/yyyy") : "");
      }
  };

  const handleToBlur = () => {
      if (!toText) {
          setDate(prev => ({ from: prev?.from, to: undefined }));
          return;
      }
      const parsed = parse(toText, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
          setDate(prev => ({ from: prev?.from, to: endOfDay(parsed) }));
      } else {
          setToText(date?.to ? format(date.to, "dd/MM/yyyy") : "");
      }
  };

  return (
    <div className={cn("grid gap-2", className)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
            <Select value={preset} onValueChange={handlePresetChange}>
                <SelectTrigger>
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
                <div className="grid grid-cols-2 gap-2">
                    <div className="relative w-full">
                        <Input
                            id="date-from"
                            value={fromText}
                            onChange={e => setFromText(e.target.value)}
                            onBlur={handleFromBlur}
                            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                            placeholder="From"
                            className={cn("pl-9 w-full", !date?.from && "text-muted-foreground")}
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="absolute left-0 top-0 h-full w-9 px-0 py-0 hover:bg-transparent">
                                    <CalendarIcon className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="single"
                                    selected={date?.from}
                                    onSelect={(day) => { setDate(prev => ({ from: day, to: prev?.to })); }}
                                    numberOfMonths={1}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="relative w-full">
                        <Input
                            id="date-to"
                            value={toText}
                            onChange={e => setToText(e.target.value)}
                            onBlur={handleToBlur}
                            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
                            placeholder="To"
                            className={cn("pl-9 w-full", !date?.to && "text-muted-foreground")}
                        />
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="absolute left-0 top-0 h-full w-9 px-0 py-0 hover:bg-transparent">
                                    <CalendarIcon className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="single"
                                    selected={date?.to}
                                    onSelect={(day) => { setDate(prev => ({ from: prev?.from, to: day ? endOfDay(day) : undefined })); }}
                                    numberOfMonths={1}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            )}
        </div>
    </div>
  )
}
