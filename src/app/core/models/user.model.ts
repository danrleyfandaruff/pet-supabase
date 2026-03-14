export interface User {
  id: string;
  name: string;
  email: string;
  id_empresa?: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  nomeEmpresa: string;
}
