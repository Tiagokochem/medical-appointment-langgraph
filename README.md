# Medical Appointment Assistant (LangGraph)

API em **Node.js** + **Fastify** que expõe um fluxo conversacional para **agendar** e **cancelar** consultas. O cérebro do sistema é um grafo **LangGraph** com nós de intenção, execução da ação e geração de resposta. Os modelos são acessados via **OpenRouter**; o estado do grafo é validado com **Zod**.

Os agendamentos e a equipe clínica ficam persistidos em **SQLite** (`node:sqlite`), com seed inicial ao criar o banco — assim o serviço sobrevive a reinícios e fica distinto de um protótipo só em memória.

## Requisitos

- Node.js **24+**
- Chave da API [OpenRouter](https://openrouter.ai/)

## Configuração

```bash
cp .env.example .env
# Edite OPENROUTER_API_KEY e, se quiser, APPOINTMENTS_DB_PATH (padrão: data/clinic.sqlite)
```

## Uso

```bash
npm install
npm run dev
```

### Endpoints

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/health` | Status do serviço e tempo de atividade |
| `GET` | `/v1/clinicians` | Lista clínicos (seed no SQLite) |
| `POST` | `/v1/assistant/message` | Corpo: `{ "text": "sua mensagem (mín. 10 caracteres)" }`. Resposta: `{ ok, data }` com o estado final do grafo |

Exemplo:

```bash
curl -s http://localhost:3000/health
curl -s http://localhost:3000/v1/clinicians
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"text":"Quero agendar com o Dr. Renato Veiga amanhã às 10h, sou Ana Costa, check-up."}' \
  http://localhost:3000/v1/assistant/message
```

## Arquitetura do grafo

```
START → identifyIntent → [schedule | cancel | message] → message → END
```

- **identifyIntent**: classifica intenção e extrai campos (com lista de clínicos vinda do banco).
- **schedule** / **cancel**: aplicam regras no `AppointmentService` (SQLite).
- **message**: gera a resposta ao usuário com o LLM.

## Testes

Os testes E2E chamam a API real e o modelo; é necessário `OPENROUTER_API_KEY` válida:

```bash
npm run test:e2e
```

## LangGraph CLI

```bash
npm run langgraph:serve
```

Requer `langgraph.json` e variáveis em `.env`.

## Licença

MIT
