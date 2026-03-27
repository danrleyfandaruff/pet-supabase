import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Status } from '../models/status.model';

@Injectable({ providedIn: 'root' })
export class StatusService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<Status[]> {
    return lastValueFrom(this.api.getStatus());
  }

  async getById(id: number): Promise<Status> {
    return lastValueFrom(this.api.getStatusById(id));
  }

  async create(item: Partial<Status>): Promise<any> {
    return lastValueFrom(this.api.cadastrarStatus(item));
  }

  async update(id: number, item: Partial<Status>): Promise<any> {
    return lastValueFrom(this.api.atualizarStatus(id, item));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarStatus(id));
  }
}
