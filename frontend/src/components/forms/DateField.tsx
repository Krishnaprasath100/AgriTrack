'use client';

import React, { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

interface DateFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {}

/** Date input with a visible calendar control for desktop and mobile users. */
export function DateField(props: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openCalendar = () => {
    const input = inputRef.current as HTMLInputElement & { showPicker?: () => void };
    input?.focus();
    input?.showPicker?.();
  };

  return (
    <div className="date-field">
      <input {...props} ref={inputRef} type="date" className={`form-input ${props.className || ''}`} />
      <button type="button" className="date-field-button" aria-label="Open calendar" onClick={openCalendar}>
        <CalendarDays size={18} />
      </button>
    </div>
  );
}
