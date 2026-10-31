import { cn } from 'cn';
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  disabled?: boolean;
  /** Figma sizes: `lg` desktop NFT detail, `md` mobile buy bar, `sm` cart rows (dark circles on mobile). */
  size?: 'lg' | 'md' | 'sm';
}

const STEP_BUTTON =
  'grid place-items-center rounded-full border border-background bg-primary text-primary-foreground shadow-[0_0_20px_rgb(10_6_4/0.45)] hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:opacity-40';

const SIZES = {
  lg: { button: 'h-[50px] w-[33px]', icon: 'size-4', value: 'text-xl' },
  md: { button: 'h-[30px] w-5', icon: 'size-3', value: 'text-lg font-medium' },
  sm: {
    button:
      'size-6 border-border bg-muted text-foreground shadow-none hover:bg-accent lg:h-[30px] lg:w-5 lg:border-background lg:bg-primary lg:text-primary-foreground lg:shadow-[0_0_20px_rgb(10_6_4/0.45)] lg:hover:bg-primary/90',
    icon: 'size-3',
    value: 'text-base lg:text-[17px]',
  },
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
