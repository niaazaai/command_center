import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toLocalISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

function parseLocalDateTime(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function DateTimePicker({ value, onChange, id, placeholder = 'Pick date and time', className, disabled, min }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseLocalDateTime(value) || new Date());
  const [hour, setHour] = useState(() => {
    const d = parseLocalDateTime(value) || new Date();
    return d.getHours();
  });
  const [minute, setMinute] = useState(() => {
    const d = parseLocalDateTime(value) || new Date();
    return d.getMinutes();
  });
  const containerRef = useRef(null);

  const valueDate = parseLocalDateTime(value);
  const displayStr = valueDate
    ? valueDate.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
    : '';

  useEffect(() => {
    if (!open) return;
    const d = valueDate || new Date();
    setViewDate(d);
    setHour(d.getHours());
    setMinute(d.getMinutes());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [open]);

  const apply = () => {
    const h = Math.min(23, Math.max(0, hour));
    const m = Math.min(59, Math.max(0, minute));
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), viewDate.getDate(), h, m);
    onChange(toLocalISO(d));
    setOpen(false);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const grid = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    grid.push({ day: d, current: false, date: new Date(year, month - 1, d) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push({ day: d, current: true, date: new Date(year, month, d) });
  }
  const rest = 42 - grid.length;
  for (let d = 1; d <= rest; d++) {
    grid.push({ day: d, current: false, date: new Date(year, month + 1, d) });
  }

  const minDate = min ? parseLocalDateTime(min) : null;
  const today = new Date();
  const isToday = (date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  const isSelected = (date) =>
    valueDate &&
    date.getDate() === valueDate.getDate() &&
    date.getMonth() === valueDate.getMonth() &&
    date.getFullYear() === valueDate.getFullYear();

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex gap-1">
        <input
          id={id}
          type="text"
          readOnly
          value={displayStr}
          placeholder={placeholder}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          onFocus={() => !disabled && setOpen(true)}
          className={cn(
            'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-lg flex-shrink-0"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          aria-label="Open calendar"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Pick date and time"
          className="absolute z-50 mt-1 left-0 w-[min(320px,100vw)] rounded-xl border border-border bg-card shadow-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewDate(new Date(year, month - 1))}
              aria-label="Previous month"
            >
              ‹
            </Button>
            <span className="text-sm font-medium">
              {MONTHS[month]} {year}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewDate(new Date(year, month + 1))}
              aria-label="Next month"
            >
              ›
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center text-xs mb-2">
            {DAYS.map((d) => (
              <div key={d} className="font-medium text-muted-foreground py-0.5">
                {d.slice(0, 1)}
              </div>
            ))}
            {grid.map(({ day, current, date }, i) => {
              const disabledDay = minDate && date < minDate;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => {
                    if (disabledDay) return;
                    setViewDate(date);
                  }}
                  className={cn(
                    'aspect-square rounded-md flex items-center justify-center text-xs transition-colors',
                    !current && 'text-muted-foreground',
                    current && isToday(date) && 'bg-primary/20 text-primary font-medium',
                    current && isSelected(date) && 'bg-primary text-primary-foreground',
                    current && !isToday(date) && !isSelected(date) && 'hover:bg-muted',
                    disabledDay && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-border pt-3">
            <Label htmlFor={`${id}-hour`} className="text-xs text-muted-foreground w-8">
              Hour
            </Label>
            <Input
              id={`${id}-hour`}
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value) || 0)}
              className="h-9 rounded-lg w-16 text-center"
            />
            <Label htmlFor={`${id}-minute`} className="text-xs text-muted-foreground w-8">
              Min
            </Label>
            <Input
              id={`${id}-minute`}
              type="number"
              min={0}
              max={59}
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value) || 0)}
              className="h-9 rounded-lg w-16 text-center"
            />
            <div className="flex-1" />
            <Button type="button" size="sm" onClick={apply}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
