import type { FieldError } from '@/contracts/field-errors';

const MESSAGES: Record<FieldError, string> = {
  required: 'Preencha este campo',
  'name.required': 'Informe seu nome',
  'username.invalid': 'Use de 3 a 20 letras minúsculas, números ou _',
  'username.taken': 'Este nome de usuário já está em uso',
  'email.invalid': 'Informe um e-mail válido',
  'email.taken': 'Este e-mail já está cadastrado',
  'password.required': 'Informe sua senha',
  'password.tooShort': 'Use pelo menos 8 caracteres',
  'password.tooLong': 'Use no máximo 72 caracteres',
  'password.needsLetter': 'Inclua pelo menos uma letra',
  'password.needsNumber': 'Inclua pelo menos um número',
  'password.unchanged': 'Escolha uma senha diferente da atual',
  'password.incorrect': 'Senha atual incorreta',
  'password.mismatch': 'As senhas não coincidem',
  'bio.tooLong': 'Use no máximo 280 caracteres',
  'coupon.required': 'Informe um código',
  'coupon.invalid': 'Cupom inválido',
  'coupon.expired': 'Este cupom expirou',
  'fullName.required': 'Informe seu nome completo',
  'note.tooLong': 'Use no máximo 280 caracteres',
  'amount.invalid': 'Informe um valor como 0,5',
  'wallet.required': 'Selecione uma carteira',
  'wallet.labelRequired': 'Dê um nome à carteira',
  'wallet.labelTooLong': 'Use no máximo 40 caracteres',
  'wallet.addressInvalid': 'Informe um endereço 0x válido',
  'wallet.addressDuplicate': 'Endereço já usado na sua outra carteira',
  'network.changed': 'A rede mudou desde a revisão',
  'avatar.type': 'Use uma imagem PNG, JPEG ou WebP',
  'avatar.size': 'Use uma imagem de até 2 MB',
};

function isFieldError(key: string): key is FieldError {
  return Object.hasOwn(MESSAGES, key);
}

export function fieldErrorMessage(key: string | undefined): string | undefined {
  if (key === undefined) return undefined;
  return isFieldError(key) ? MESSAGES[key] : 'Valor inválido';
}
