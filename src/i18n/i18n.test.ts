import { describe, expect, it } from 'vitest';
import { ApiRequestError } from '@/lib/api-error';
import { errorMessage } from './api-errors';
import { fieldErrorMessage } from './field-errors';
import { formatShortDate, normalizeDecimalInput, plural } from './locale';

describe('i18n', () => {
  it('localizes field error keys and hides unknown prose', () => {
    expect(fieldErrorMessage('coupon.expired')).toBe('Este cupom expirou');
    expect(fieldErrorMessage('Too small: expected string to have >=1 characters')).toBe(
      'Valor inválido',
    );
    expect(fieldErrorMessage(undefined)).toBeUndefined();
  });

  it('describes API errors by code instead of the server message', () => {
    const error = new ApiRequestError('QUOTE_OUTDATED', 'Quote fingerprint changed.', 409);
    expect(errorMessage(error)).toBe('Preços ou disponibilidade mudaram. Revise o novo total.');
    expect(errorMessage(new Error('boom'))).toBe('Algo deu errado. Tente novamente.');
  });

  it('pluralizes and normalizes decimals for pt-BR', () => {
    expect(plural(1, { one: 'item', other: 'itens' })).toBe('item');
    expect(plural(0, { one: 'item', other: 'itens' })).toBe('itens');
    expect(normalizeDecimalInput(' 0,5 ')).toBe('0.5');
  });

  it('formats compact dates without the pt-BR connectors', () => {
    expect(formatShortDate('2026-10-31T12:00:00Z')).toBe('31 out. 2026');
  });
});
