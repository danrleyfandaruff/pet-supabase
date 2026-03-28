import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Serviço centralizado de comunicação com o backend NestJS.
 *
 * Dev:       http://localhost:3000
 * Produção:  https://nestjs-api.automacao360pets.com.br
 *
 * O AuthInterceptor injeta o token JWT automaticamente em todas as requisições.
 * Os services do domínio (cliente.service.ts, animal.service.ts, etc.) usam este
 * serviço via lastValueFrom() para manter a interface async/await para as páginas.
 *
 * Mutações (POST/PUT/DELETE/PATCH) usam responseType: 'text' porque o NestJS
 * retorna strings de confirmação com Content-Type: text/html, o que causaria
 * falha de JSON.parse no Angular sem essa opção.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  // Opções para chamadas que retornam texto puro (mutações NestJS)
  private readonly textOpts = { responseType: 'text' as 'json' };

  constructor(private http: HttpClient) {}

  private url(path: string): string {
    return `${this.base}/${path.replace(/^\//, '')}`;
  }

  // Helpers privados para mutações — usam responseType: 'text'
  private _post(path: string, body: any = {}): Observable<any> {
    return this.http.post(this.url(path), body, this.textOpts);
  }
  private _put(path: string, body: any = {}): Observable<any> {
    return this.http.put(this.url(path), body, this.textOpts);
  }
  private _del(path: string): Observable<any> {
    return this.http.delete(this.url(path), this.textOpts);
  }
  private _patch(path: string, body: any = {}): Observable<any> {
    return this.http.patch(this.url(path), body, this.textOpts);
  }

  // ─────────────────────────────────────────────
  // AUTENTICAÇÃO
  // Mantém JSON porque login/signup retornam objetos (token, user)
  // ─────────────────────────────────────────────

  login(email: string, password: string): Observable<any> {
    return this.http.post(this.url('auth/login'), { email, password });
  }

  signup(email: string, password: string, options: { name: string; nomeEmpresa: string }): Observable<any> {
    return this.http.post(this.url('auth/signup'), { email, password, options });
  }

  logout(): Observable<any> {
    return this._post('auth/logout');
  }

  me(): Observable<{ id: string; email: string; name: string; id_empresa: string | null; created_at: string }> {
    return this.http.get<any>(this.url('auth/me'));
  }

  refresh(refreshToken: string): Observable<{ access_token: string; refresh_token: string; expires_at: number }> {
    return this.http.post<any>(this.url('auth/refresh'), { refresh_token: refreshToken });
  }

  // ─────────────────────────────────────────────
  // CLIENTES
  // ─────────────────────────────────────────────

  getClientes(): Observable<any[]> {
    return this.http.get<any[]>(this.url('clientes/obter'));
  }

  getClientesAtivos(): Observable<any[]> {
    return this.http.get<any[]>(this.url('clientes/ativos'));
  }

  getClienteById(id: number): Observable<any> {
    return this.http.get(this.url(`clientes/${id}`));
  }

  cadastrarCliente(data: any): Observable<any> {
    return this._post('clientes/cadastrar', data);
  }

  atualizarCliente(id: number, data: any): Observable<any> {
    return this._put(`clientes/${id}`, data);
  }

  deletarCliente(id: number): Observable<any> {
    return this._del(`clientes/${id}`);
  }

  softDeletarCliente(id: number): Observable<any> {
    return this._patch(`clientes/${id}/soft-delete`);
  }

  // ─────────────────────────────────────────────
  // ANIMAIS
  // ─────────────────────────────────────────────

  getAnimais(): Observable<any[]> {
    return this.http.get<any[]>(this.url('animal/obter'));
  }

  getAnimalById(id: number): Observable<any> {
    return this.http.get(this.url(`animal/${id}`));
  }

  getAnimaisPorCliente(idCliente: number): Observable<any[]> {
    return this.http.get<any[]>(this.url(`animal/por-cliente/${idCliente}`));
  }

  cadastrarAnimal(data: any): Observable<any> {
    // Retorna o animal criado como JSON (usado pelo cadastro rápido de pet)
    return this.http.post(this.url('animal/cadastrar'), data);
  }

  atualizarAnimal(id: number, data: any): Observable<any> {
    return this._put(`animal/${id}`, data);
  }

  deletarAnimal(id: number): Observable<any> {
    return this._del(`animal/${id}`);
  }

  softDeletarAnimal(id: number): Observable<any> {
    return this._patch(`animal/${id}/soft-delete`);
  }

  buscarAnimalCliente(nomePet?: string, nomeCliente?: string): Observable<any[]> {
    const params: any = {};
    if (nomePet) params['nome_pet'] = nomePet;
    if (nomeCliente) params['nome_cliente'] = nomeCliente;
    return this.http.get<any[]>(this.url('animal/cliente/novo'), { params });
  }

  // ─────────────────────────────────────────────
  // RAÇAS
  // ─────────────────────────────────────────────

  getRacas(): Observable<any[]> {
    return this.http.get<any[]>(this.url('raca/obter'));
  }

  getRacaById(id: number): Observable<any> {
    return this.http.get(this.url(`raca/${id}`));
  }

  cadastrarRaca(data: any): Observable<any> {
    return this._post('raca/cadastrar', data);
  }

  atualizarRaca(id: number, data: any): Observable<any> {
    return this._put(`raca/${id}`, data);
  }

  deletarRaca(id: number): Observable<any> {
    return this._del(`raca/${id}`);
  }

  softDeletarRaca(id: number): Observable<any> {
    return this._patch(`raca/${id}/soft-delete`);
  }

  // ─────────────────────────────────────────────
  // RESPONSÁVEIS
  // ─────────────────────────────────────────────

  getResponsaveis(): Observable<any[]> {
    return this.http.get<any[]>(this.url('responsavel/obter'));
  }

  getResponsaveisAtivos(): Observable<any[]> {
    return this.http.get<any[]>(this.url('responsavel/ativos'));
  }

  getResponsavelById(id: number): Observable<any> {
    return this.http.get(this.url(`responsavel/${id}`));
  }

  cadastrarResponsavel(data: any): Observable<any> {
    return this._post('responsavel/cadastrar', data);
  }

  atualizarResponsavel(id: number, data: any): Observable<any> {
    return this._put(`responsavel/${id}`, data);
  }

  deletarResponsavel(id: number): Observable<any> {
    return this._del(`responsavel/${id}`);
  }

  softDeletarResponsavel(id: number): Observable<any> {
    return this._patch(`responsavel/${id}/soft-delete`);
  }

  // ─────────────────────────────────────────────
  // SERVIÇOS
  // ─────────────────────────────────────────────

  getServicos(): Observable<any[]> {
    return this.http.get<any[]>(this.url('servicos/obter'));
  }

  getServicosAtivos(): Observable<any[]> {
    return this.http.get<any[]>(this.url('servicos/ativos'));
  }

  getServicoById(id: number): Observable<any> {
    return this.http.get(this.url(`servicos/${id}`));
  }

  cadastrarServico(data: any): Observable<any> {
    return this._post('servicos/cadastrar', data);
  }

  atualizarServico(id: number, data: any): Observable<any> {
    return this._put(`servicos/${id}`, data);
  }

  deletarServico(id: number): Observable<any> {
    return this._del(`servicos/${id}`);
  }

  softDeletarServico(id: number): Observable<any> {
    return this._patch(`servicos/${id}/soft-delete`);
  }

  // ─────────────────────────────────────────────
  // TIPOS DE SERVIÇO
  // ─────────────────────────────────────────────

  getTiposServico(): Observable<any[]> {
    return this.http.get<any[]>(this.url('servico/tipo/obter'));
  }

  getTipoServicoById(id: number): Observable<any> {
    return this.http.get(this.url(`servico/tipo/${id}`));
  }

  cadastrarTipoServico(data: any): Observable<any> {
    return this._post('servico/tipo/cadastrar', data);
  }

  atualizarTipoServico(id: number, data: any): Observable<any> {
    return this._put(`servico/tipo/${id}`, data);
  }

  deletarTipoServico(id: number): Observable<any> {
    return this._del(`servico/tipo/${id}`);
  }

  softDeletarTipoServico(id: number): Observable<any> {
    return this._patch(`servico/tipo/${id}/soft-delete`);
  }

  // ─────────────────────────────────────────────
  // STATUS
  // ─────────────────────────────────────────────

  getStatus(): Observable<any[]> {
    return this.http.get<any[]>(this.url('status/obter'));
  }

  getStatusById(id: number): Observable<any> {
    return this.http.get(this.url(`status/${id}`));
  }

  cadastrarStatus(data: any): Observable<any> {
    return this._post('status/cadastrar', data);
  }

  atualizarStatus(id: number, data: any): Observable<any> {
    return this._put(`status/${id}`, data);
  }

  deletarStatus(id: number): Observable<any> {
    return this._del(`status/${id}`);
  }

  // ─────────────────────────────────────────────
  // ATENDIMENTOS
  // ─────────────────────────────────────────────

  getAtendimentos(): Observable<any[]> {
    return this.http.get<any[]>(this.url('atendimento/obter'));
  }

  getAtendimentoById(id: number): Observable<any> {
    return this.http.get(this.url(`atendimento/${id}`));
  }

  getAtendimentosHoje(): Observable<any[]> {
    return this.http.get<any[]>(this.url('atendimento/hoje'));
  }

  countAtendimentosPendentes(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(this.url('atendimento/pendentes/count'));
  }

  getAtendimentosPorAnimal(idAnimal: number): Observable<any[]> {
    return this.http.get<any[]>(this.url(`atendimento/por-animal/${idAnimal}`));
  }

  getAtendimentosPorCliente(idCliente: number): Observable<any[]> {
    return this.http.get<any[]>(this.url(`atendimento/por-cliente/${idCliente}`));
  }

  getAtendimentosPorPeriodo(inicio: string, fim: string): Observable<any[]> {
    return this.http.get<any[]>(this.url('atendimento/periodo'), { params: { inicio, fim } });
  }

  cadastrarAtendimento(data: any): Observable<any> {
    return this._post('atendimento/cadastrar', data);
  }

  atualizarAtendimento(id: number, data: any): Observable<any> {
    return this._put(`atendimento/${id}`, data);
  }

  marcarAtendimentoPago(id: number): Observable<any> {
    return this._patch(`atendimento/${id}/marcar-pago`);
  }

  desmarcarAtendimentoPago(id: number): Observable<any> {
    return this._patch(`atendimento/${id}/desmarcar-pago`);
  }

  deletarAtendimento(id: number): Observable<any> {
    return this._del(`atendimento/${id}`);
  }

  softDeletarAtendimento(id: number): Observable<any> {
    return this._patch(`atendimento/${id}/soft-delete`);
  }

  getAtendimentosCompleto(): Observable<any[]> {
    return this.http.get<any[]>(this.url('atendimentos'));
  }

  // ─────────────────────────────────────────────
  // SERVIÇOS DE ATENDIMENTO
  // ─────────────────────────────────────────────

  getServicosAtendimento(): Observable<any[]> {
    return this.http.get<any[]>(this.url('servicos-atendimento/obter'));
  }

  cadastrarServicoAtendimento(data: any): Observable<any> {
    return this._post('servicos-atendimento/cadastrar', data);
  }

  deletarServicoAtendimento(id: number): Observable<any> {
    return this._del(`servicos-atendimento/${id}`);
  }

  // ─────────────────────────────────────────────
  // PACOTES
  // ─────────────────────────────────────────────

  getPacotes(): Observable<any[]> {
    return this.http.get<any[]>(this.url('pacote/obter'));
  }

  getPacotesAtivos(): Observable<any[]> {
    return this.http.get<any[]>(this.url('pacote/ativos'));
  }

  getPacoteById(id: number): Observable<any> {
    return this.http.get(this.url(`pacote/${id}`));
  }

  cadastrarPacote(data: any): Observable<any> {
    return this._post('pacote/cadastrar', data);
  }

  atualizarPacote(id: number, data: any): Observable<any> {
    return this._put(`pacote/${id}`, data);
  }

  deletarPacote(id: number): Observable<any> {
    return this._del(`pacote/${id}`);
  }

  softDeletarPacote(id: number): Observable<any> {
    return this._patch(`pacote/${id}/soft-delete`);
  }

  // ─────────────────────────────────────────────
  // AQUISIÇÃO DE PACOTES
  // ─────────────────────────────────────────────

  getAquisicoesPacote(): Observable<any[]> {
    return this.http.get<any[]>(this.url('pacote/aquisicao/obter'));
  }

  getAquisicaoPacoteById(id: number): Observable<any> {
    return this.http.get(this.url(`pacote/aquisicao/${id}`));
  }

  getAquisicoesPorAnimal(idAnimal: number): Observable<any[]> {
    return this.http.get<any[]>(this.url(`pacote/aquisicao/por-animal/${idAnimal}`));
  }

  cadastrarAquisicaoPacote(data: any): Observable<any> {
    return this._post('pacote/aquisicao/cadastrar', data);
  }

  deletarAquisicaoPacote(id: number): Observable<any> {
    return this._del(`pacote/aquisicao/${id}`);
  }

  softDeletarAquisicaoPacote(id: number): Observable<any> {
    return this._patch(`pacote/aquisicao/${id}/soft-delete`);
  }

  // ─────────────────────────────────────────────
  // BENEFÍCIOS DE PACOTE
  // ─────────────────────────────────────────────

  getBeneficios(): Observable<any[]> {
    return this.http.get<any[]>(this.url('beneficios/obter'));
  }

  cadastrarBeneficio(data: any): Observable<any> {
    return this._post('beneficios/pacote', data);
  }

  // ─────────────────────────────────────────────
  // PLANOS
  // ─────────────────────────────────────────────

  contratarPlano(data: any): Observable<any> {
    return this._post('plano/contratar', data);
  }

  cancelarPlano(aquisicaoId: number, atendimentoIds: number[]): Observable<any> {
    return this._post('plano/cancelar', { aquisicaoId, atendimentoIds });
  }

  // ─────────────────────────────────────────────
  // CAIXA
  // ─────────────────────────────────────────────

  getCaixa(): Observable<any[]> {
    return this.http.get<any[]>(this.url('caixa/obter'));
  }

  getCaixaOrdenado(): Observable<any[]> {
    return this.http.get<any[]>(this.url('caixa/obter/ordenado'));
  }

  getCaixaById(id: number): Observable<any> {
    return this.http.get(this.url(`caixa/${id}`));
  }

  getTotalMesAtual(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(this.url('caixa/total-mes-atual'));
  }

  getCaixaMensal(meses = 6): Observable<any[]> {
    return this.http.get<any[]>(this.url('caixa/mensal'), { params: { meses: meses.toString() } });
  }

  getCaixaPorPeriodo(inicio: string, fim: string): Observable<any[]> {
    return this.http.get<any[]>(this.url('caixa/periodo'), { params: { inicio, fim } });
  }

  cadastrarCaixa(data: any): Observable<any> {
    return this._post('caixa/cadastrar', data);
  }

  atualizarCaixa(id: number, data: any): Observable<any> {
    return this._put(`caixa/${id}`, data);
  }

  deletarCaixa(id: number): Observable<any> {
    return this._del(`caixa/${id}`);
  }

  deletarCaixaPorAtendimento(idAtendimento: number): Observable<any> {
    return this._del(`caixa/por-atendimento/${idAtendimento}`);
  }

  // ─────────────────────────────────────────────
  // COLABORADORES
  // ─────────────────────────────────────────────

  getColaboradores(): Observable<any[]> {
    return this.http.get<any[]>(this.url('colaboradores/obter'));
  }

  convidarColaborador(data: { email: string; password: string; nome?: string; cargo?: string }): Observable<any> {
    return this._post('colaboradores/convidar', data);
  }

  atualizarColaborador(id: string, data: { nome?: string; cargo?: string; ativo?: boolean }): Observable<any> {
    return this._put(`colaboradores/${id}`, data);
  }

  removerColaborador(id: string): Observable<any> {
    return this._del(`colaboradores/${id}`);
  }
}
