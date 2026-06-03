# Engineering Software Development - Avaliação Final

**FIAP - MBA em Engenharia de Software - 10AOJR**

**Integrantes**

- `367438` - Brunna Cataryne Rosa Webster
- `366865` - Danielle Moreira
- `368605` - Leonardo Braga de Almeida
- `367369` - Victor Hugo dos Santos Telles

<br>

# iPet - PetPass Compliance Service

Microsserviço do motor **CaaS (Compliance as a Service)** da plataforma iPet.  
Avalia o **StatusCompliance** (Apto/Inapto) de um animal de estimação para embarque aéreo, aplicando as regras de período de carência sanitária por país de destino e emitindo o **Smart Pet Pass**.

## Sumário

1. [Visão Geral](#visão-geral)
2. [Regras de Negócio](#regras-de-negócio)
3. [Pré-requisitos](#pré-requisitos)
4. [Como Rodar](#como-rodar)
5. [Endpoints da API](#endpoints-da-api)
6. [Exemplos de Uso](#exemplos-de-uso)
7. [Design Patterns Aplicados](#design-patterns-aplicados)
8. [Suite de Testes](#suite-de-testes)
9. [Estrutura do Projeto](#estrutura-do-projeto)

---

## Visão Geral

A iPet é uma plataforma Super App cujo produto de entrada é o **Smart Pet Pass**: um motor de Compliance as a Service (CaaS) que automatiza a validação sanitária de animais de estimação para embarque aéreo, reduzindo o check-in de 20 minutos para 30 segundos.

Este microsserviço implementa o **bounded context PET Pass (Core Domain)**, responsável por:

- Registrar **RegistrosSanitarios** (vacinação antirrábica, sorologia, vermífugos, antipulgas) de um Pet
- Avaliar o **StatusCompliance** (Apto/Inapto) com base nas regras de período de carência por **Destino**
- Emitir o **Smart Pet Pass** com o resultado da avaliação

### Atores

| Ator                 | Ação principal                                 |
| -------------------- | ---------------------------------------------- |
| Responsável pelo Pet | Consulta o StatusCompliance e o Smart Pet Pass |
| Veterinário          | Registra RegistrosSanitarios                   |
| Motor CaaS (sistema) | Avalia compliance e emite o PetPass            |

## Regras de Negócio

O motor CaaS aplica as seguintes invariantes de período de carência sanitária:

| Destino                 | Período de carência (vacina) | Sorologia obrigatória | Período de carência (sorologia) |
| ----------------------- | ---------------------------- | --------------------- | ------------------------------- |
| **BR** — Brasil         | 21 dias                      | Não                   | —                               |
| **EU** — União Europeia | 90 dias                      | Sim                   | 90 dias                         |
| **JP** — Japão          | 180 dias                     | Sim                   | 180 dias                        |
| Outros                  | 21 dias                      | Não                   | —                               |

Um Pet recebe **StatusCompliance = Apto (ELIGIBLE)** somente quando todas as condições do destino são satisfeitas. Caso contrário, recebe **Inapto (INELIGIBLE)** com motivo e data de liberação estimada.

## Pré-requisitos

- **Node.js** ≥ 18
- **npm** ≥ 9

Nenhuma outra dependência de infraestrutura é necessária. O banco de dados SQLite é criado automaticamente na primeira execução.

## Como Rodar

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento (hot reload)
npm run start:dev

# Iniciar em modo produção
npm run build && npm run start:prod
```

A API estará disponível em `http://localhost:3000`.

Na inicialização, as **RegraDestino** (BR, EU, JP) são populadas automaticamente no banco pelo `DatabaseSeeder`.

## Endpoints da API

| Método | Rota                       | Descrição                                            |
| ------ | -------------------------- | ---------------------------------------------------- |
| `POST` | `/pets`                    | Cadastrar um novo Pet                                |
| `GET`  | `/pets/:id`                | Consultar dados cadastrais do Pet                    |
| `POST` | `/pets/:id/health-records` | Registrar um RegistroSanitario                       |
| `GET`  | `/pets/:id/health-records` | Listar histórico de RegistrosSanitarios              |
| `POST` | `/pets/:petId/petpass`     | Emitir o Smart Pet Pass (avalia compliance)          |
| `GET`  | `/petpass/:id`             | Consultar o Smart Pet Pass e seu StatusCompliance    |
| `POST` | `/petpass/:id/compliance`  | Reavaliar o StatusCompliance sem emitir novo PetPass |

## Exemplos de Uso

### 1. Cadastrar um Pet

```bash
curl -X POST http://localhost:3000/pets \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rex",
    "speciesType": "DOG",
    "birthDate": "2020-01-01",
    "microchip": "CHIP123456789"
  }'
```

**Resposta (201):**

```json
{
  "id": "uuid-do-pet",
  "name": "Rex",
  "speciesType": "DOG",
  "birthDate": "2020-01-01",
  "microchip": "CHIP123456789"
}
```

### 2. Registrar vacina antirrábica

```bash
curl -X POST http://localhost:3000/pets/{pet_id}/health-records \
  -H "Content-Type: application/json" \
  -d '{
    "recordType": "RABIES_VACCINE",
    "appliedAt": "2026-05-01"
  }'
```

### 3. Emitir o Smart Pet Pass

```bash
curl -X POST http://localhost:3000/pets/{pet_id}/petpass \
  -H "Content-Type: application/json" \
  -d '{
    "destinationCode": "BR"
  }'
```

**Resposta — StatusCompliance Apto:**

```json
{
  "id": "uuid-do-petpass",
  "complianceStatus": "ELIGIBLE",
  "reason": null,
  "releaseDate": null,
  "destinationCode": "BR",
  "expiresAt": "2026-09-01"
}
```

**Resposta — StatusCompliance Inapto:**

```json
{
  "id": "uuid-do-petpass",
  "complianceStatus": "INELIGIBLE",
  "reason": "Período de carência da vacina não cumprido para BR. Faltam 9 dia(s).",
  "releaseDate": "2026-06-04",
  "destinationCode": "BR",
  "expiresAt": "2026-09-01"
}
```

## Design Patterns Aplicados

### SOLID

| Princípio                     | Implementação no código                                                                                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S — Single Responsibility** | `ComplianceEngineService` tem responsabilidade única: avaliar compliance. `EmitPetPassUseCase` tem responsabilidade única: orquestrar a emissão. Cada classe faz exatamente uma coisa.                                            |
| **O — Open/Closed**           | `DestinationRule` é data-driven: novos destinos são inseridos como registros no banco sem alterar o `ComplianceEngineService`. O motor está aberto para extensão (novos países) e fechado para modificação.                       |
| **L — Liskov Substitution**   | `PetRepository` (SQLite em arquivo) e o repositório em memória usado nos testes são intercambiáveis — ambos implementam `IPetRepository` sem alterar o comportamento esperado pelos use cases.                                    |
| **I — Interface Segregation** | `IPetRepository`, `IHealthRecordRepository`, `IPetPassRepository` e `IDestinationRuleRepository` são interfaces segregadas. Cada use case injeta apenas as interfaces de que necessita, sem depender de contratos desnecessários. |
| **D — Dependency Inversion**  | Todos os use cases e serviços de domínio dependem de interfaces (abstrações), nunca das implementações TypeORM concretas. O container de injeção de dependência do NestJS resolve as implementações em runtime.                   |

### GRASP

| Padrão                 | Implementação no código                                                                                                                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Information Expert** | `PetPass.isExpired()` está implementado na própria entidade `PetPass`, que é quem possui os dados de expiração. O Value Object `ComplianceStatus` conhece seu próprio estado e expõe apenas métodos de consulta.            |
| **Creator**            | `EmitPetPassUseCase` cria o `PetPass` porque é ele que agrega todas as informações necessárias: o Pet, os RegistrosSanitarios e o resultado da avaliação do motor CaaS.                                                     |
| **Controller (GRASP)** | `PetPassController` é o único ponto de entrada HTTP para as operações do Smart Pet Pass. Delega toda a lógica de negócio aos use cases sem implementar regras de compliance diretamente.                                    |
| **Low Coupling**       | Os módulos NestJS se comunicam exclusivamente através de interfaces de domínio (`PET_REPOSITORY`, `HEALTH_RECORD_REPOSITORY`, etc.), nunca importando implementações concretas de outros módulos.                           |
| **High Cohesion**      | `ComplianceEngineService` concentra toda a lógica de avaliação sanitária. `PetsModule` agrupa exclusivamente as operações de Pet e RegistroSanitario. `PetPassModule` agrupa exclusivamente as operações do Smart Pet Pass. |

---

## Suite de Testes

O projeto possui três conjuntos de testes cobrindo a pirâmide de testes:

```
test/
  unit/
    compliance-engine.service.spec.ts   # 8 testes — invariantes I1 (BR), I2 (EU), I3 (JP)
    emit-petpass.use-case.spec.ts       # 3 testes — orquestração do caso de uso com mocks
  integration/
    pet-pass.controller.spec.ts         # 3 testes — fluxo HTTP completo com banco em memória
```

### Executar os testes

```bash
# Todos os testes
npm test

# Com relatório de cobertura
npm run test:cov

# Modo watch (re-executa ao salvar)
npm run test:watch
```

> Os testes de integração sobem o `AppModule` completo com banco SQLite em memória (`sql.js`). Não é necessário nenhuma infraestrutura externa para rodá-los.

### Cobertura dos testes unitários do ComplianceEngineService

| Cenário                        | Destino | Resultado                         |
| ------------------------------ | ------- | --------------------------------- |
| Vacina aplicada há 25 dias     | BR      | ✅ ELIGIBLE                       |
| Vacina aplicada há 15 dias     | BR      | ✅ INELIGIBLE + data de liberação |
| Sem vacina registrada          | BR      | ✅ INELIGIBLE                     |
| Vacina sem sorologia           | EU      | ✅ INELIGIBLE                     |
| Vacina + sorologia há 95 dias  | EU      | ✅ ELIGIBLE                       |
| Sorologia com apenas 60 dias   | EU      | ✅ INELIGIBLE + dias restantes    |
| Sorologia com apenas 90 dias   | JP      | ✅ INELIGIBLE + dias restantes    |
| Vacina + sorologia há 185 dias | JP      | ✅ ELIGIBLE                       |

---

## Estrutura do Projeto

```
src/
├── domain/                         # Regras de negócio puras (sem dependências de framework)
│   ├── entities/                   # Pet, PetPass, HealthRecord, DestinationRule
│   ├── enums/                      # SpeciesType, RecordType, ComplianceStatusValue
│   ├── value-objects/              # ComplianceStatus (StatusCompliance)
│   ├── interfaces/                 # Contratos de repositório (DIP)
│   ├── services/                   # ComplianceEngineService (motor CaaS)
│   └── utils/                      # Utilitários de data
├── application/                    # Casos de uso e DTOs
│   ├── dtos/
│   └── use-cases/                  # EmitPetPassUseCase, EvaluateComplianceUseCase
├── infrastructure/                 # Detalhes técnicos (TypeORM, SQLite)
│   ├── database/                   # Configuração e DatabaseSeeder
│   └── repositories/               # Implementações concretas dos repositórios
├── presentation/                   # Camada HTTP (NestJS)
│   ├── controllers/                # PetsController, PetPassController
│   ├── guards/                     # JwtAuthGuard
│   └── strategies/                 # JwtStrategy
└── modules/                        # Módulos NestJS (AuthModule, PetsModule, PetPassModule)

test/
├── unit/                           # Testes unitários com mocks
└── integration/                    # Testes de integração com banco em memória
```
