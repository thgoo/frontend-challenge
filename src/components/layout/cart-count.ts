import { plural } from '@/i18n/locale';

export function cartLabel(count: number): string {
  return `Carrinho, ${String(count)} ${plural(count, { one: 'item', other: 'itens' })}`;
}
