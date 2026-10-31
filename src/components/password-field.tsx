import { cn } from 'cn';
import { Eye } from 'lucide-react';
import { HideIcon } from '@/components/icons';
import { useState, type ComponentProps } from 'react';
import { Field } from '@/components/form-field';
import { Input } from '@/components/ui/input';

type PasswordFieldProps = Omit<ComponentProps<typeof Input>, 'type'> & {
  label: string;
  error?: string;
  hint?: string;
  hideLabel?: boolean;
};

export function PasswordField({
  label,
  error,
  hint,
  hideLabel,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} error={error} hint={hint} hideLabel={hideLabel}>
      {(control) => (
        <div className="relative">
          <Input
            {...control}
            {...inputProps}
            type={visible ? 'text' : 'password'}
            className={cn('pr-11', className)}
          />
          <button
            type="button"
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            onClick={() => {
              setVisible((current) => !current);
            }}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded text-subtle hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {/* As in the Figma, the icon shows the current state: crossed out while hidden. */}
            {visible ? (
              <Eye aria-hidden="true" className="size-5" />
            ) : (
              <HideIcon className="size-5" />
            )}
          </button>
        </div>
      )}
    </Field>
  );
}
