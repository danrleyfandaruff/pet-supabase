import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Cliente } from '../models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<Cliente[]> {
    return lastValueFrom(this.api.getClientes());
  }

  async getAllAtivos(): Promise<Cliente[]> {
    return lastValueFrom(this.api.getClientesAtivos());
  }

  async getById(id: number): Promise<Cliente> {
    return lastValueFrom(this.api.getClienteById(id));
  }

  async create(item: Partial<Cliente>): Promise<any> {
    return lastValueFrom(this.api.cadastrarCliente(item));
  }

  async update(id: number, item: Partial<Cliente>): Promise<any> {
    return lastValueFrom(this.api.atualizarCliente(id, item));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarCliente(id));
  }

  async softDelete(id: number): Promise<any> {
    return lastValueFrom(this.api.softDeletarCliente(id));
  }
}
