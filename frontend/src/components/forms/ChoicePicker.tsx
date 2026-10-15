'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface ChoicePickerOption {
  value: string;
  label: string;
  group?: string;
}

interface ChoicePickerProps {
  ariaLabel: string;
  value: string;
  options: ChoicePickerOption[];
  placeholder: string;
  onChange: (value: string) => void;
}

/** A viewport-safe picker; native select menus can overflow mobile app frames. */
export function ChoicePicker({ ariaLabel, value, options, placeholder, onChange }: ChoicePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const closeOnOutsidePress = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsidePress);
    document.addEventListener('touchstart', closeOnOutsidePress, { passive: true });
    return () => {
      document.removeEventListener('mousedown', closeOnOutsidePress);
      document.removeEventListener('touchstart', closeOnOutsidePress);
    };
  }, []);

  let previousGroup: string | undefined;
  return (
    <div className="choice-picker" ref={rootRef}>
      <button type="button" className={`choice-picker-trigger${open ? ' is-open' : ''}${selected ? '' : ' is-placeholder'}`} aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span>{selected?.label || placeholder}</span><ChevronDown size={18} aria-hidden="true" />
      </button>
      {open && <div className="choice-picker-menu" role="listbox" aria-label={ariaLabel}>
        {options.map((option) => {
          const groupLabel = option.group && option.group !== previousGroup ? option.group : undefined;
          previousGroup = option.group;
          const isSelected = value === option.value;
          return <React.Fragment key={option.value}>
            {groupLabel && <div className="choice-picker-group">{groupLabel}</div>}
            <button type="button" role="option" aria-selected={isSelected} className={`choice-picker-option${isSelected ? ' is-selected' : ''}`} onClick={() => { onChange(option.value); setOpen(false); }}>
              <span>{option.label}</span>{isSelected && <Check size={16} aria-hidden="true" />}
            </button>
          </React.Fragment>;
        })}
      </div>}
    </div>
  );
}
