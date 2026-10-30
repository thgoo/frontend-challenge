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
  /** A validation key from the contracts; it is localized here. */
  error?: string;
  hint?: string;
  id?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/** Wires label, hint and error to any control so assistive tech announces them together. */
export function Field({ label, error, hint, id, children }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  return (
    <div className="grid gap-2">
      <Label htmlFor={controlId}>{label}</Label>
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

export function FormField({ label, error, hint, id, ...inputProps }: FormFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} id={id}>
      {(control) => <Input {...control} {...inputProps} />}
    </Field>
  );
}
