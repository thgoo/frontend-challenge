import { toApiRequestError, type ClientErrorCode } from '@/lib/api-error';

/** The API's own `message` is for logs; what the user reads comes from the stable error code. */
const MESSAGES: Record<ClientErrorCode, string> = {
  VALIDATION_FAILED: 'Alguns campos estão inválidos. Revise e tente novamente.',
  UNAUTHENTICATED: 'E-mail ou senha incorretos.',
  SESSION_EXPIRED: 'Sua sessão expirou. Entre novamente.',
  FORBIDDEN: 'Você não tem permissão para fazer isso.',
  NOT_FOUND: 'Não encontramos o que você procura.',
  CONFLICT: 'Não foi possível concluir por causa de um conflito. Revise os dados.',
  AVAILABILITY_CONFLICT: 'Um item do carrinho não tem mais a quantidade disponível.',
  QUOTE_OUTDATED: 'Preços ou disponibilidade mudaram. Revise o novo total.',
  COUPON_INVALID: 'Cupom inválido.',
  COUPON_EXPIRED: 'Este cupom expirou.',
  IDEMPOTENCY_CONFLICT:
    'Este pedido já foi enviado com outros dados. Revise antes de tentar de novo.',
  WALLET_REJECTED: 'A carteira recusou a conexão.',
  WALLET_DISCONNECTED: 'Sua carteira foi desconectada. Conecte novamente para continuar.',
  SERVICE_UNAVAILABLE: 'O serviço está indisponível no momento. Tente novamente em instantes.',
  NETWORK_ERROR: 'Não foi possível conectar ao servidor. Verifique sua conexão.',
  TIMEOUT: 'O servidor demorou para responder. Tente novamente.',
  CONTRACT_VIOLATION: 'Recebemos uma resposta inesperada do servidor.',
  UNKNOWN: 'Algo deu errado. Tente novamente.',
};

export function errorMessage(error: unknown): string {
  return MESSAGES[toApiRequestError(error).code];
}
