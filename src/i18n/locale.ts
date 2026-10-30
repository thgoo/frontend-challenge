export const LOCALE = 'pt-BR';

const decimalPart = new Intl.NumberFormat(LOCALE)
  .formatToParts(1.5)
  .find((part) => part.type === 'decimal');

export const DECIMAL_SEPARATOR = decimalPart?.value ?? '.';

const pluralRules = new Intl.PluralRules(LOCALE);

/** CLDR groups 0 with "one" in Portuguese, but Brazilian usage reads "0 itens". */
export function plural(count: number, forms: { one: string; other: string }): string {
  return count !== 0 && pluralRules.select(count) === 'one' ? forms.one : forms.other;
}

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'long', timeStyle: 'short' });

export function formatDateTime(value: string | Date): string {
  return dateTimeFormat.format(new Date(value));
}

/** Accepts amounts typed with the local decimal separator and returns the API's dotted form. */
export function normalizeDecimalInput(value: string): string {
  return value.trim().replace(DECIMAL_SEPARATOR, '.');
}

const ratingFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function formatRating(average: number): string {
  return ratingFormat.format(average);
}
