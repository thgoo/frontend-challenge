import { useId, type ComponentProps, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldErrorMessage } from '@/i18n/field-errors';

export interface FieldControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby': string | undefined;
}

interface FieldProps {
  label: string;
  /** Marks the label with the Figma asterisk; the control itself carries `required`. */
  required?: boolean;
  /** Placeholder-only designs keep the label for assistive technology. */
  hideLabel?: boolean;
  /** A validation key from the contracts; it is localized here. */
  error?: string;
  hint?: string;
  id?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/** Wires label, hint and error to any control so assistive tech announces them together. */
export function Field({ label, required, hideLabel, error, hint, id, children }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <div className="grid gap-2">
      <Label htmlFor={controlId} className={hideLabel ? 'sr-only' : 'text-[15px] font-normal'}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </Label>
      {children({
        id: controlId,
        'aria-invalid': Boolean(error),
        'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined,
      })}
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {fieldErrorMessage(error)}
        </p>
      )}
    </div>
  );
}

type FormFieldProps = ComponentProps<typeof Input> & Omit<FieldProps, 'children'>;

export function FormField(props: FormFieldProps) {
  const { label, error, hint, id, required, hideLabel, ...inputProps } = props;
  return (
    <Field
      label={label}
      required={required}
      hideLabel={hideLabel}
      error={error}
      hint={hint}
      id={id}
    >
      {(control) => <Input {...control} required={required} {...inputProps} />}
    </Field>
  );
}
