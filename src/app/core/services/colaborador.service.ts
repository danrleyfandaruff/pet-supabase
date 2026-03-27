import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Colaborador } from '../models/colaborador.model';

@Injectable({ providedIn: 'root' })
export class ColaboradorService {
  constructor(private api: ApiService) {}

  getAll(): Promise<Colaborador[]> {
    return lastValueFrom(this.api.getColaboradores());
  }

  convidar(data: { email: string; password: string; nome?: string; cargo?: string }): Promise<any> {
    return lastValueFrom(this.api.convidarColaborador(data));
  }

  update(id: string, data: { nome?: string; cargo?: string; ativo?: boolean }): Promise<any> {
    return lastValueFrom(this.api.atualizarColaborador(id, data));
  }

  remove(id: string): Promise<any> {
    return lastValueFrom(this.api.removerColaborador(id));
  }
}
