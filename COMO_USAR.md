# Ionic Auth App — Como usar

## Pré-requisitos

- Node.js 18+
- npm 9+

## Instalação

```bash
# 1. Entre na pasta do projeto
cd ionic-auth-app

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm start
```

Acesse: http://localhost:4200

---

## Build para produção

```bash
npm run build
```

---

## Estrutura do projeto

```
src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts       → Protege rotas privadas
│   │   └── no-auth.guard.ts    → Redireciona usuários logados
│   ├── interceptors/
│   │   └── auth.interceptor.ts → Injeta JWT em todas as requisições
│   ├── models/
│   │   └── user.model.ts       → Interfaces de dados
│   └── services/
│       ├── auth.service.ts     → Autenticação + estado global (BehaviorSubject)
│       └── storage.service.ts  → Abstração do Ionic Storage
└── pages/
    ├── login/                  → Tela de login (rota pública)
    ├── register/               → Tela de cadastro (rota pública)
    └── home/                   → Tela principal (rota protegida)
```

---

## Configurar a API

Edite `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://SUA-API-AQUI.com',  // <-- altere aqui
  tokenKey: 'auth_token',
  userKey: 'auth_user',
};
```

A API deve retornar o seguinte formato em `/auth/login` e `/auth/register`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "name": "João Silva",
    "email": "joao@email.com"
  }
}
```

---

## Funcionalidades

- **Login** com e-mail e senha + validação de formulário
- **Cadastro** com validação de senha e confirmação
- **Logout** com confirmação via alert
- **JWT interceptor** — token enviado automaticamente em todas as requests
- **AuthGuard** — redireciona para login se não estiver autenticado
- **NoAuthGuard** — redireciona para home se já estiver logado
- **Sessão persistida** com Ionic Storage (IndexedDB/SQLite)
- **Estado global reativo** via `BehaviorSubject` no `AuthService`
- **Dark mode** automático pelo sistema operacional
