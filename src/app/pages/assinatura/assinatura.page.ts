import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { LoadingController, ToastController } from '@ionic/angular';
import { ApiService } from '../../core/services/api.service';

export interface Plano {
  id: string;
  nome: string;
  descricao: string;
  precoMensal: number;
  precoAnual: number; // preço mensal com desconto anual
  destaque: boolean;
  recursos: string[];
  badge?: string;
}

@Component({
  selector: 'app-assinatura',
  templateUrl: './assinatura.page.html',
  styleUrls: ['./assinatura.page.scss'],
})
export class AssinaturaPage implements OnInit {
  isAnual = false;
  get periodo(): 'mensal' | 'anual' { return this.isAnual ? 'anual' : 'mensal'; }
  planoSelecionado: string | null = null;
  carregando = false;

  status: any = null;

  planos: Plano[] = [
    {
      id: 'basico',
      nome: 'Básico',
      descricao: 'Ideal para petshops iniciantes',
      precoMensal: 49,
      precoAnual: 39,
      destaque: false,
      recursos: [
        'Agenda de atendimentos',
        'Cadastro de clientes e pets',
        'Controle de caixa',
        'Relatórios básicos',
        'Suporte por e-mail',
      ],
    },
    {
      id: 'profissional',
      nome: 'Profissional',
      descricao: 'Para petshops em crescimento',
      precoMensal: 89,
      precoAnual: 71,
      destaque: true,
      badge: 'Mais popular',
      recursos: [
        'Tudo do Básico',
        'Resumo inteligente com IA',
        'Controle de colaboradores',
        'Gestão de planos/pacotes',
        'Comissões automáticas',
        'Prontuário dos animais',
        'Suporte prioritário',
      ],
    },
    {
      id: 'premium',
      nome: 'Premium',
      descricao: 'Para redes e grandes petshops',
      precoMensal: 149,
      precoAnual: 119,
      destaque: false,
      badge: 'Em breve',
      recursos: [
        'Tudo do Profissional',
        'Múltiplas unidades',
        'API de integração',
        'Relatórios avançados',
        'Gerente de conta dedicado',
        'SLA garantido',
      ],
    },
  ];

  constructor(
    private apiService: ApiService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private location: Location,
  ) {}

  voltar() {
    this.location.back();
  }

  ngOnInit() {
    this.carregarStatus();
  }

  async carregarStatus() {
    try {
      this.status = await this.apiService.getAssinaturaStatus().toPromise();
    } catch {
      // ignora — pode estar sem assinatura
    }
  }

  get precoExibido() {
    return (plano: Plano) =>
      this.periodo === 'mensal' ? plano.precoMensal : plano.precoAnual;
  }

  get economiaAnual() {
    return (plano: Plano) =>
      Math.round(((plano.precoMensal - plano.precoAnual) / plano.precoMensal) * 100);
  }

  async assinar(planoId: string) {
    if (planoId === 'premium') {
      this.mostrarToast('O plano Premium estará disponível em breve!', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Redirecionando para o pagamento...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      const res = await this.apiService
        .criarCheckoutAssinatura(planoId, this.periodo)
        .toPromise();

      await loading.dismiss();

      if (res?.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      await loading.dismiss();
      this.mostrarToast(
        err?.message ?? 'Erro ao iniciar checkout. Tente novamente.',
        'danger',
      );
    }
  }

  async gerenciarAssinatura() {
    const loading = await this.loadingCtrl.create({
      message: 'Abrindo portal...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      const res = await this.apiService.criarPortalAssinatura().toPromise();
      await loading.dismiss();
      if (res?.url) window.open(res.url, '_blank');
    } catch (err: any) {
      await loading.dismiss();
      this.mostrarToast(
        err?.message ?? 'Erro ao abrir portal. Tente novamente.',
        'danger',
      );
    }
  }

  private async mostrarToast(message: string, color = 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
