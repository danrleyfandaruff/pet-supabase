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
  fallback = 'Sistema indisponível no momento, tente novamente mais tarde',
): string {
  if (!e) return fallback;

  if (typeof e === 'string') return e.trim() || fallback;

  if (typeof e === 'object') {
    const err = e as Record<string, unknown>;
    const msg = err['message'];
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
  }

  return fallback;
}
