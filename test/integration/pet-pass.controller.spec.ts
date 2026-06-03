import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

/**
 * Testes de integração do PetPassController.
 *
 * Sobe o AppModule completo com banco SQLite em memória (NODE_ENV=test,
 * definido automaticamente pelo Jest) e executa chamadas HTTP reais via Supertest.
 * O DatabaseSeeder popula as RegraDestino (BR, EU, JP) na inicialização.
 */
describe('PetPassController (integração)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // Helper: formata data N dias atrás como "YYYY-MM-DD" no fuso local
  // ---------------------------------------------------------------------------
  function localDateDaysAgo(daysAgo: number): string {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // ---------------------------------------------------------------------------
  // Teste 1 — Cadastro de Pet
  // ---------------------------------------------------------------------------

  it('POST /pets deve criar um pet e retornar HTTP 201 com id', async () => {
    const response = await request(app.getHttpServer())
      .post('/pets')
      .send({
        name: 'Rex',
        speciesType: 'DOG',
        birthDate: '2020-01-01',
        microchip: 'CHIP000111222',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Rex');
    expect(response.body.microchip).toBe('CHIP000111222');
  });

  // ---------------------------------------------------------------------------
  // Teste 2 — Emissão sem registros sanitários → INELIGIBLE
  // ---------------------------------------------------------------------------

  it('POST /pets/:id/petpass sem RegistroSanitario deve retornar INELIGIBLE', async () => {
    const petRes = await request(app.getHttpServer())
      .post('/pets')
      .send({
        name: 'Buddy',
        speciesType: 'DOG',
        birthDate: '2021-06-15',
        microchip: 'CHIP333444555',
      });

    const response = await request(app.getHttpServer())
      .post(`/pets/${petRes.body.id}/petpass`)
      .send({ destinationCode: 'BR' })
      .expect(200);

    expect(response.body.complianceStatus).toBe('INELIGIBLE');
    expect(response.body.reason).toMatch(/Nenhuma vacina antirrábica/);
  });

  // ---------------------------------------------------------------------------
  // Teste 3 — Fluxo completo: cadastrar → vacinar → emitir PetPass → ELIGIBLE
  // ---------------------------------------------------------------------------

  it('fluxo completo: criar pet → registrar vacina antirrábica → emitir PetPass para BR deve retornar ELIGIBLE', async () => {
    // 1. Cadastra o Pet
    const petRes = await request(app.getHttpServer())
      .post('/pets')
      .send({
        name: 'Luna',
        speciesType: 'CAT',
        birthDate: '2022-03-10',
        microchip: 'CHIP666777888',
      });

    const petId = petRes.body.id;
    expect(petId).toBeDefined();

    // 2. Registra vacina antirrábica aplicada há 25 dias (waiting period BR = 21 dias)
    await request(app.getHttpServer())
      .post(`/pets/${petId}/health-records`)
      .send({
        recordType: 'RABIES_VACCINE',
        appliedAt: localDateDaysAgo(25),
      })
      .expect(201);

    // 3. Emite o Smart Pet Pass para destino BR
    const response = await request(app.getHttpServer())
      .post(`/pets/${petId}/petpass`)
      .send({ destinationCode: 'BR' })
      .expect(200);

    expect(response.body.complianceStatus).toBe('ELIGIBLE');
    expect(response.body.destinationCode).toBe('BR');
    expect(response.body.reason).toBeNull();
  });
});
