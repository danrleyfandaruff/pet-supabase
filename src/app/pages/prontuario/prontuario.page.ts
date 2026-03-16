import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AnimalService } from '../../core/services/animal.service';
import { AtendimentoService } from '../../core/services/atendimento.service';
import { AquisicaoPacoteService } from '../../core/services/aquisicao-pacote.service';
import { Animal } from '../../core/models/animal.model';
import { Atendimento } from '../../core/models/atendimento.model';
import { AquisicaoPacote } from '../../core/models/aquisicao-pacote.model';

@Component({
  selector: 'app-prontuario',
  templateUrl: './prontuario.page.html',
  styleUrls: ['./prontuario.page.scss'],
})
export class ProntuarioPage implements OnInit {
  animalId!: number;
  animal: Animal | null = null;
  atendimentos: Atendimento[] = [];
  planos: AquisicaoPacote[] = [];
  isLoading = false;

  // Edição de observações/alergias
  editandoObs = false;
  obsTemp = '';
  alergiasTemp = '';

  constructor(
    private route: ActivatedRoute,
    private animalService: AnimalService,
    private atendimentoService: AtendimentoService,
    private aquisicaoService: AquisicaoPacoteService,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.animalId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  ionViewWillEnter() { this.loadData(); }

  async loadData() {
    if (!this.animalId) return;
    this.isLoading = true;
    try {
      const [animal, ats, planos] = await Promise.all([
        this.animalService.getById(this.animalId),
        this.atendimentoService.getByAnimal(this.animalId),
        this.aquisicaoService.getByAnimal(this.animalId),
      ]);
      this.animal = animal;
      this.atendimentos = ats;
      this.planos = planos;
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
    }
  }

  iniciarEdicaoSaude() {
    this.obsTemp = this.animal?.observacoes ?? '';
    this.alergiasTemp = this.animal?.alergias ?? '';
    this.editandoObs = true;
  }

  async salvarSaude() {
    if (!this.animal?.id) return;
    try {
      await this.animalService.update(this.animal.id, {
        observacoes: this.obsTemp,
        alergias: this.alergiasTemp,
      });
      if (this.animal) {
        this.animal.observacoes = this.obsTemp;
        this.animal.alergias = this.alergiasTemp;
      }
      this.editandoObs = false;
      const t = await this.toastCtrl.create({ message: 'Prontuário atualizado!', duration: 2000, color: 'success', position: 'top' });
      await t.present();
    } catch (e: any) {
      const t = await this.toastCtrl.create({ message: e.message, duration: 2500, color: 'danger', position: 'top' });
      await t.present();
    }
  }

  cancelarEdicaoSaude() {
    this.editandoObs = false;
  }

  get totalSessoes() { return this.atendimentos.length; }
  get sessoesPagas() { return this.atendimentos.filter(a => a.pago).length; }
  get planosAtivos() {
    return this.planos.filter(p => {
      const ats = p.atendimento ?? [];
      const total = p.pacote?.quantidade ?? ats.length;
      const concluidos = ats.filter(a => a.pago || a.status_info?.nome?.toLowerCase().includes('conclu')).length;
      return concluidos < total;
    });
  }

  idadeAnimal(): string {
    if (!this.animal?.data_nascimento) return 'Não informada';
    const nasc = new Date(this.animal.data_nascimento + 'T12:00:00');
    const hoje = new Date();
    let anos = hoje.getFullYear() - nasc.getFullYear();
    let meses = hoje.getMonth() - nasc.getMonth();
    if (meses < 0) { anos--; meses += 12; }
    if (anos > 0) return `${anos} ano${anos !== 1 ? 's' : ''}`;
    if (meses > 0) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    return 'Filhote';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${dias[d.getDay()]}, ${d.getDate()} ${meses[d.getMonth()]}`;
  }
}
