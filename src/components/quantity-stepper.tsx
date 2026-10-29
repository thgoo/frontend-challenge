import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
}

export function QuantityStepper({ value, max, onChange, label, disabled }: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-lg border p-1"
    >
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Decrease quantity"
        disabled={disabled || value <= 1}
        onClick={() => {
          onChange(value - 1);
        }}
      >
        <Minus aria-hidden="true" />
      </Button>
      <output aria-live="polite" className="min-w-8 text-center font-medium tabular-nums">
        {value}
      </output>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => {
          onChange(value + 1);
        }}
      >
        <Plus aria-hidden="true" />
      </Button>
    </div>
  );
}
