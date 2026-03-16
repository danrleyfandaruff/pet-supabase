import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ClienteService } from '../../core/services/cliente.service';
import { AnimalService } from '../../core/services/animal.service';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { Cliente } from '../../core/models/cliente.model';
import { Animal } from '../../core/models/animal.model';
import { Atendimento } from '../../core/models/atendimento.model';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-perfil-cliente',
  templateUrl: './perfil-cliente.page.html',
  styleUrls: ['./perfil-cliente.page.scss'],
})
export class PerfilClientePage implements OnInit {
  clienteId!: number;
  cliente: Cliente | null = null;
  animais: Animal[] = [];
  atendimentos: Atendimento[] = [];
  isLoading = false;

  // Métricas
  totalGasto = 0;
  totalSessoes = 0;
  saldoPendente = 0;

  constructor(
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private clienteService: ClienteService,
    private animalService: AnimalService,
    private atendimentoService: AtendimentoService,
  ) {}

  ngOnInit() {
    this.clienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  ionViewWillEnter() { this.loadData(); }

  async loadData() {
    if (!this.clienteId) return;
    this.isLoading = true;
    try {
      const [cliente, animais, ats] = await Promise.all([
        this.clienteService.getById(this.clienteId),
        this.animalService.getByCliente(this.clienteId),
        this.atendimentoService.getByCliente(this.clienteId),
      ]);
      this.cliente = cliente;
      this.animais = animais;
      this.atendimentos = ats;
      this.calcularMetricas();
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
    }
  }

  private calcularMetricas() {
    this.totalSessoes = this.atendimentos.length;
    this.totalGasto = this.atendimentos
      .filter(a => a.pago)
      .reduce((s, a) => s + Number(a.servico?.valor ?? 0) + Number(a.valor_adicional ?? 0), 0);
    this.saldoPendente = this.atendimentos
      .filter(a => !a.pago)
      .reduce((s, a) => s + Number(a.servico?.valor ?? 0) + Number(a.valor_adicional ?? 0), 0);
  }

  get ultimosAtendimentos() {
    return this.atendimentos.slice(0, 10);
  }

  irParaProntuario(animal: Animal) {
    this.navCtrl.navigateForward(`/tabs/prontuario/${animal.id}`);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]}`;
  }

  formatCurrency(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  iniciais(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }
}
