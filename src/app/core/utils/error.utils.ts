/**
 * Extrai uma mensagem legível de qualquer erro capturado em catch.
 *
 * Erros HTTP já chegam aqui tratados pelo AuthInterceptor (que converte
 * HttpErrorResponse em Error com mensagem amigável). Esta função apenas
 * extrai o texto final para uso em toasts e alertas.
 *
 * Prioridade:
 *   1. error.message  (Error JS padrão — inclusive o que o interceptor cria)
 *   2. String pura
 *   3. Fallback fornecido pelo chamador
 *
 * Uso:
 *   await this.showToast(errorMsg(e, 'Erro ao salvar'), 'danger');
 */
export function errorMsg(
  e: unknown,
  fallback = 'Não foi possível completar a operação. Tente novamente.',
): string {
  if (!e) return fallback;

  if (typeof e === 'string') return e.trim() || fallback;

  if (typeof e === 'object') {
    const err = e as Record<string, unknown>;

    // Prioridade 1: .message (Error padrão JS, já tratado pelo interceptor)
    const msg = err['message'];
    if (typeof msg === 'string' && msg.trim() && msg.trim().length < 300) {
      return msg.trim();
    }

    // Prioridade 2: .error (alguns formatos de resposta do NestJS)
    const sub = err['error'];
    if (typeof sub === 'string' && sub.trim() && sub.trim().length < 300) {
      return sub.trim();
    }
  }

  return fallback;
}
