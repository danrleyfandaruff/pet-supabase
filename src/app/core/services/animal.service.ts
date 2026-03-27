import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { Animal } from '../models/animal.model';

@Injectable({ providedIn: 'root' })
export class AnimalService {
  constructor(private api: ApiService) {}

  async getAll(): Promise<Animal[]> {
    return lastValueFrom(this.api.getAnimais());
  }

  async getById(id: number): Promise<Animal> {
    return lastValueFrom(this.api.getAnimalById(id));
  }

  async getByCliente(idCliente: number): Promise<Animal[]> {
    return lastValueFrom(this.api.getAnimaisPorCliente(idCliente));
  }

  async create(item: Partial<Animal>): Promise<any> {
    return lastValueFrom(this.api.cadastrarAnimal(item));
  }

  async update(id: number, item: Partial<Animal>): Promise<any> {
    return lastValueFrom(this.api.atualizarAnimal(id, item));
  }

  async delete(id: number): Promise<any> {
    return lastValueFrom(this.api.deletarAnimal(id));
  }

  async softDelete(id: number): Promise<any> {
    return lastValueFrom(this.api.softDeletarAnimal(id));
  }
}
