import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';

/**
 * Testes de integração — cobertura completa dos endpoints da API.
 *
 * Sobe o AppModule completo com banco SQLite em memória (NODE_ENV=test,
 * definido automaticamente pelo Jest) e executa chamadas HTTP reais via Supertest.
 * O DatabaseSeeder popula as RegraDestino (BR, EU, JP) na inicialização.
 */
describe('PetPass API (integração)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
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
  // POST /pets — Cadastrar Pet
  // ---------------------------------------------------------------------------

  describe('POST /pets', () => {
    it('deve criar um pet e retornar HTTP 201 com id', async () => {
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
      expect(response.body.speciesType).toBe('DOG');
      expect(response.body.microchip).toBe('CHIP000111222');
    });

    it('deve retornar HTTP 400 com dados inválidos', async () => {
      await request(app.getHttpServer())
        .post('/pets')
        .send({ name: 'Rex' }) // faltam campos obrigatórios
        .expect(400);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /pets/:id — Consultar Pet
  // ---------------------------------------------------------------------------

  describe('GET /pets/:id', () => {
    it('deve retornar o pet cadastrado com HTTP 200', async () => {
      const created = await request(app.getHttpServer())
        .post('/pets')
        .send({
          name: 'Mia',
          speciesType: 'CAT',
          birthDate: '2021-03-10',
          microchip: 'CHIP333444555',
        });

      const response = await request(app.getHttpServer())
        .get(`/pets/${created.body.id}`)
        .expect(200);

      expect(response.body.id).toBe(created.body.id);
      expect(response.body.name).toBe('Mia');
    });

    it('deve retornar HTTP 404 para pet inexistente', async () => {
      await request(app.getHttpServer())
        .get('/pets/id-que-nao-existe')
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /pets/:id/health-records — Registrar RegistroSanitario
  // ---------------------------------------------------------------------------

  describe('POST /pets/:id/health-records', () => {
    it('deve registrar uma vacina antirrábica e retornar HTTP 201', async () => {
      const pet = await request(app.getHttpServer())
        .post('/pets')
        .send({
          name: 'Thor',
          speciesType: 'DOG',
          birthDate: '2019-07-20',
          microchip: 'CHIP666777888',
        });

      const response = await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/health-records`)
        .send({
          recordType: 'RABIES_VACCINE',
          appliedAt: localDateDaysAgo(30),
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.recordType).toBe('RABIES_VACCINE');
      expect(response.body.petId).toBe(pet.body.id);
    });

    it('deve retornar HTTP 404 ao registrar para pet inexistente', async () => {
      await request(app.getHttpServer())
        .post('/pets/id-inexistente/health-records')
        .send({
          recordType: 'RABIES_VACCINE',
          appliedAt: localDateDaysAgo(30),
        })
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /pets/:id/health-records — Listar RegistrosSanitarios
  // ---------------------------------------------------------------------------

  describe('GET /pets/:id/health-records', () => {
    it('deve listar os RegistrosSanitarios de um pet com HTTP 200', async () => {
      const pet = await request(app.getHttpServer())
        .post('/pets')
        .send({
          name: 'Luna',
          speciesType: 'CAT',
          birthDate: '2022-01-01',
          microchip: 'CHIP999000111',
        });

      await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/health-records`)
        .send({ recordType: 'RABIES_VACCINE', appliedAt: localDateDaysAgo(25) });

      await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/health-records`)
        .send({ recordType: 'SEROLOGY', appliedAt: localDateDaysAgo(20) });

      const response = await request(app.getHttpServer())
        .get(`/pets/${pet.body.id}/health-records`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('recordType');
    });
  });

  // ---------------------------------------------------------------------------
  // POST /pets/:petId/petpass — Emitir Smart Pet Pass
  // ---------------------------------------------------------------------------

  describe('POST /pets/:petId/petpass', () => {
    it('deve retornar INELIGIBLE para pet sem RegistroSanitario', async () => {
      const pet = await request(app.getHttpServer())
        .post('/pets')
        .send({
          name: 'Buddy',
          speciesType: 'DOG',
          birthDate: '2021-06-15',
          microchip: 'CHIP111222333',
        });

      const response = await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/petpass`)
        .send({ destinationCode: 'BR' })
        .expect(200);

      expect(response.body.complianceStatus).toBe('INELIGIBLE');
      expect(response.body.reason).toMatch(/Nenhuma vacina antirrábica/);
    });

    it('deve retornar ELIGIBLE após vacinar há 25 dias para destino BR', async () => {
      const pet = await request(app.getHttpServer())
        .post('/pets')
        .send({
          name: 'Max',
          speciesType: 'DOG',
          birthDate: '2020-05-01',
          microchip: 'CHIP444555666',
        });

      await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/health-records`)
        .send({ recordType: 'RABIES_VACCINE', appliedAt: localDateDaysAgo(25) });

      const response = await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/petpass`)
        .send({ destinationCode: 'BR' })
        .expect(200);

      expect(response.body.complianceStatus).toBe('ELIGIBLE');
      expect(response.body.destinationCode).toBe('BR');
      expect(response.body).toHaveProperty('expiresAt');
    });

    it('deve retornar INELIGIBLE para destino EU sem sorologia', async () => {
      const pet = await request(app.getHttpServer())
        .post('/pets')
        .send({
          name: 'Bella',
          speciesType: 'CAT',
          birthDate: '2021-02-10',
          microchip: 'CHIP777888999',
        });

      await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/health-records`)
        .send({ recordType: 'RABIES_VACCINE', appliedAt: localDateDaysAgo(95) });

      const response = await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/petpass`)
        .send({ destinationCode: 'EU' })
        .expect(200);

      expect(response.body.complianceStatus).toBe('INELIGIBLE');
      expect(response.body.reason).toMatch(/Sorologia obrigatória/);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /petpass/:id — Consultar Smart Pet Pass
  // ---------------------------------------------------------------------------

  describe('GET /petpass/:id', () => {
    it('deve retornar o PetPass emitido com HTTP 200', async () => {
      const pet = await request(app.getHttpServer())
        .post('/pets')
        .send({
          name: 'Zeus',
          speciesType: 'DOG',
          birthDate: '2019-11-15',
          microchip: 'CHIP101010101',
        });

      await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/health-records`)
        .send({ recordType: 'RABIES_VACCINE', appliedAt: localDateDaysAgo(30) });

      const petPass = await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/petpass`)
        .send({ destinationCode: 'BR' });

      const response = await request(app.getHttpServer())
        .get(`/petpass/${petPass.body.id}`)
        .expect(200);

      expect(response.body.id).toBe(petPass.body.id);
      expect(response.body.complianceStatus).toBe('ELIGIBLE');
      expect(response.body.destinationCode).toBe('BR');
    });

    it('deve retornar HTTP 404 para PetPass inexistente', async () => {
      await request(app.getHttpServer())
        .get('/petpass/id-inexistente')
        .expect(404);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /petpass/:id/compliance — Reavaliar StatusCompliance
  // ---------------------------------------------------------------------------

  describe('POST /petpass/:id/compliance', () => {
    it('deve reavaliar o StatusCompliance e retornar HTTP 200', async () => {
      const pet = await request(app.getHttpServer())
        .post('/pets')
        .send({
          name: 'Nala',
          speciesType: 'CAT',
          birthDate: '2020-08-20',
          microchip: 'CHIP202020202',
        });

      await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/health-records`)
        .send({ recordType: 'RABIES_VACCINE', appliedAt: localDateDaysAgo(30) });

      const petPass = await request(app.getHttpServer())
        .post(`/pets/${pet.body.id}/petpass`)
        .send({ destinationCode: 'BR' });

      const response = await request(app.getHttpServer())
        .post(`/petpass/${petPass.body.id}/compliance`)
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('ELIGIBLE');
    });

    it('deve retornar HTTP 404 ao reavaliar PetPass inexistente', async () => {
      await request(app.getHttpServer())
        .post('/petpass/id-inexistente/compliance')
        .expect(404);
    });
  });
});
