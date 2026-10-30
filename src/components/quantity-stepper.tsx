import { cn } from 'cn';
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
  /** `sm` is the compact stepper used in cart rows. */
  size?: 'md' | 'sm';
}

const STEP_BUTTON =
  'grid place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:opacity-40';

const SIZES = {
  md: { button: 'size-[30px]', icon: 'size-4', value: 'text-xl' },
  sm: { button: 'size-[22px]', icon: 'size-3', value: 'text-base' },
};

export function QuantityStepper(props: QuantityStepperProps) {
  const { value, max, onChange, label, disabled, size = 'md' } = props;
  const styles = SIZES[size];
  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-3">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= 1}
        onClick={() => {
          onChange(value - 1);
        }}
        className={cn(STEP_BUTTON, styles.button)}
      >
        <Minus aria-hidden="true" className={styles.icon} />
      </button>
      <output aria-live="polite" className={cn('min-w-5 text-center tabular-nums', styles.value)}>
        {value}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        disabled={disabled || value >= max}
        onClick={() => {
          onChange(value + 1);
        }}
        className={cn(STEP_BUTTON, styles.button)}
      >
        <Plus aria-hidden="true" className={styles.icon} />
      </button>
    </div>
  );
}
