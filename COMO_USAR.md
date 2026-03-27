# GroomerLab360 — Manual do Sistema

Aplicativo mobile de gestão para pet shops e grooming, desenvolvido com **Ionic Angular 7** + **Supabase**.

---

## Instalação e execução

**Pré-requisitos:** Node.js 18+, npm 9+

```bash
cd ionic-auth-app
npm install
npm start          # http://localhost:4200
npm run build      # build de produção
```

---

## Estrutura de pastas

```
src/app/
├── core/
│   ├── models/            → Interfaces TypeScript (Animal, Atendimento, etc.)
│   ├── services/          → Serviços de dados (CRUD via Supabase)
│   └── guards/            → AuthGuard / NoAuthGuard
└── pages/
    ├── inicio/            → Home com cards de acesso rápido
    ├── atendimentos/      → Agenda + formulário de agendamento
    ├── clientes/          → Lista de tutores
    ├── animais/           → Lista de pets
    ├── servicos/          → Catálogo de serviços
    ├── pacotes/           → Planos/pacotes de sessões
    ├── planos/            → Acompanhamento de planos ativos
    ├── caixa/             → Entradas e saídas financeiras
    ├── relatorios/        → Relatórios e métricas
    ├── perfil-cliente/    → Perfil completo do tutor (rota /perfil-cliente/:id)
    ├── prontuario/        → Prontuário do pet (rota /prontuario/:id)
    ├── comissoes/         → Comissões por tosador/mês
    └── configuracoes/     → Ajustes gerais do sistema
```

---

## Telas e funcionalidades

### Início (Home)
- Saudação personalizada com nome do usuário
- **3 stats em tempo real:** atendimentos hoje · receita do mês · sem pagamento
- Cards de acesso rápido: Agenda, Caixa, Tutores, Pets, Serviços, Pacotes, Planos, Relatórios, Comissões

---

### Agenda (Atendimentos)
Central do sistema. Toca-se em **+** para agendar.

**Vista Lista:**
- Calendário mensal com navegação de mês; dias com atendimento marcados com ponto
- Filtros rápidos: Todos · Hoje · Não pagos (com contagem)
- Card por atendimento com pet, data, tosador, serviço e badge de status clicável

**Vista Semana (ícone calendário no header):**
- Alterna para grade semanal de segunda a domingo
- Chips coloridos por dia (azul = não pago, verde = pago)
- Clique no chip abre o formulário de edição

**Ações no card:**
| Botão | Ação |
|---|---|
| 💰 (verde) | Abre modal "Dar Baixa" — confirma valor e lança no caixa |
| ↩ (cinza) | Desfaz pagamento e remove lançamento do caixa |
| ✏️ | Edita o atendimento |
| 🗑️ | Exclui o atendimento |
| Badge de status | Abre seletor de status (ActionSheet com todos os status) |

**Modo seleção múltipla (ícone ✓✓ no header):**
- Selecione vários atendimentos com checkbox
- **Concluir (N)** — muda status para "Concluído" sem lançar pagamento
- **Pagar (N)** — marca como pago e lança no caixa em lote
- **Cancelar** — sai do modo seleção

**Formulário de agendamento:**
- Campos: Data · Pet · Tutor · Tosador · Serviço · Pacote · Valor adicional · Status
- Status padrão: **Agendado** (preenchido automaticamente)
- Botões **+ Tutor** e **+ Pet** para cadastro rápido via alerta
- Se selecionar um **pacote com quantidade > 1**: fluxo multissessão
  - Clicando em "Próximo →" abre tela de prévia com N datas calculadas
  - Cada data pode ser editada individualmente (toque no ícone de lápis)
  - "Confirmar" cria o registro de aquisição de pacote + N atendimentos de uma vez

---

### Tutores (Clientes)
- Lista com busca por nome, telefone ou e-mail
- Botão **👤** abre o **Perfil do Cliente**
- Botão ✏️ edita o cadastro; 🗑️ exclui

---

### Perfil do Cliente (`/tabs/perfil-cliente/:id`)
Acessado pelo botão de pessoa na lista de tutores.

- Header com iniciais do nome, telefone e e-mail
- Cards de resumo: Total Gasto · Saldo Pendente · Sessões · Pets
- Lista de pets com raça — clique navega para o **Prontuário do Pet**
- Histórico dos últimos 10 atendimentos com status de pagamento

---

### Pets (Animais)
- Lista com busca por nome, tutor ou raça
- Botão **🕐** abre modal de histórico inline
- Botão **📖** abre o **Prontuário do Pet**
- Botão ✏️ edita; 🗑️ desativa

---

### Prontuário do Pet (`/tabs/prontuario/:id`)
Acessado pelo botão de livro na lista de pets.

- Header com nome, raça, tutor e idade calculada
- Stats: total de sessões · sessões pagas · planos ativos
- **Saúde & Observações** — edição inline de alergias e observações gerais (salvas no banco)
- Lista de planos ativos com contador de sessões
- Histórico completo de atendimentos com status

---

### Planos (`/tabs/planos`)
Acompanhamento de todos os pacotes adquiridos.

- Card por plano com nome do pet, pacote, barra de progresso e lista de sessões
- Sessões com indicadores visuais: ⚪ pendente · 🔵 próxima · 🟢 concluída
- **Cancelar plano** disponível apenas se nenhuma sessão foi realizada ainda
- Se já houver sessões concluídas: exibe mensagem de bloqueio com ícone de cadeado

---

### Caixa
- Histórico de entradas e saídas ordenado por data
- Lançamentos vinculados automaticamente ao dar baixa em atendimentos
- Gráfico de barras dos últimos 6 meses (entradas vs saídas)

---

### Relatórios (`/tabs/relatorios`)
Acessado pelo card "Relatórios" na Home.

- **Seletor de período:** Esta semana · Este mês · Últimos 3 meses · Este ano
- **Métricas:** Receita · Despesas · Lucro Líquido · Atendimentos · Pagos · Ticket Médio
- **Top 5 Serviços** por receita com barra de progresso relativa
- **Top 5 Clientes** por receita com barra de progresso

---

### Comissões (`/tabs/comissoes`)
Acessado pelo card "Comissões" na Home.

- Seletor dos últimos 12 meses
- Resumo geral: total produzido · total de comissões
- Card por tosador com:
  - Produção bruta (atendimentos pagos no período)
  - Percentual de comissão editável (toque no botão com o %)
  - Valor da comissão calculado
  - Barra visual proporcional ao percentual
- Percentuais são configuráveis individualmente e mantidos na sessão

---

### Configurações (Ajustes)
Gerencia os dados base do sistema:

| Seção | O que cadastra |
|---|---|
| Status | Status de atendimento (Agendado, Em andamento, Concluído...) |
| Responsáveis | Tosadores e banhistas |
| Raças | Raças de cães e gatos |

---

## Banco de dados (Supabase)

Tabelas principais:

| Tabela | Descrição |
|---|---|
| `cliente` | Tutores/donos dos pets |
| `animal` | Pets — vinculados a um cliente, com campos `observacoes` e `alergias` |
| `responsavel` | Tosadores/funcionários |
| `servico` | Catálogo de serviços com valor |
| `pacote` | Planos com `quantidade` de sessões e `recorrencia` em dias |
| `aquisicao_pacote` | Registro de compra de um plano por um pet |
| `atendimento` | Agendamentos — vinculados a cliente, animal, responsável, serviço ou pacote |
| `status` | Status de atendimento (configurável) |
| `caixa` | Lançamentos financeiros (entrada/saída) |

Scripts SQL disponíveis na raiz do projeto para configurar RLS, triggers e estrutura.

---

## Observações técnicas

- **Autenticação:** Supabase Auth com JWT; sessão persistida via `BehaviorSubject`
- **Multi-tenant:** cada tenant isolado por `id_tenant` nas tabelas de dados
- **RLS (Row Level Security):** ativo no Supabase — cada usuário acessa apenas seus próprios dados
- **Offline/loading:** spinners e `ion-refresher` em todas as listas
- **iOS safe area:** `env(safe-area-inset-bottom)` nos footers de ação
