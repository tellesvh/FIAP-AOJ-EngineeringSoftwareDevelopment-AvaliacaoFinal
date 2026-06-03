import { ComplianceEngineService } from '../../src/domain/services/compliance-engine.service';
import { ComplianceStatusValue } from '../../src/domain/enums/compliance-status.enum';
import { RecordType } from '../../src/domain/enums/record-type.enum';
import { DestinationRule } from '../../src/domain/entities/destination-rule.entity';
import { HealthRecord } from '../../src/domain/entities/health-record.entity';
import { IDestinationRuleRepository } from '../../src/domain/interfaces/destination-rule.repository.interface';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Cria um HealthRecord de teste com a data de aplicação calculada
 * retroativamente a partir do número de dias informado.
 */
function makeRecord(type: RecordType, daysAgo: number): HealthRecord {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    id: 'test-id',
    recordType: type,
    appliedAt: date.toISOString().split('T')[0],
    veterinarianId: null,
    notes: null,
    createdAt: new Date(),
    pet: null as any,
    petId: 'pet-test-id',
  };
}

/** RegraDestino para o Brasil — waiting period de 21 dias, sem sorologia. */
const BR_RULE: DestinationRule = {
  destinationCode: 'BR',
  waitingPeriodDays: 21,
  serologyRequired: false,
  serologyWaitingPeriodDays: 0,
};

/** RegraDestino para a União Europeia — waiting period de 90 dias, sorologia obrigatória. */
const EU_RULE: DestinationRule = {
  destinationCode: 'EU',
  waitingPeriodDays: 90,
  serologyRequired: true,
  serologyWaitingPeriodDays: 90,
};

/** RegraDestino para o Japão — waiting period de 180 dias, sorologia obrigatória. */
const JP_RULE: DestinationRule = {
  destinationCode: 'JP',
  waitingPeriodDays: 180,
  serologyRequired: true,
  serologyWaitingPeriodDays: 180,
};

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe('ComplianceEngineService — applyRules()', () => {
  let service: ComplianceEngineService;

  beforeEach(() => {
    // Mock mínimo do repositório — applyRules() não o utiliza diretamente
    const mockRepo: IDestinationRuleRepository = {
      findByCode: jest.fn(),
      findAll: jest.fn(),
    };
    service = new ComplianceEngineService(mockRepo);
  });

  // ── Brasil (I1) ────────────────────────────────────────────────────────────

  it('deve retornar ELIGIBLE para vacina antirrábica aplicada há 25 dias — destino BR', () => {
    const records = [makeRecord(RecordType.RABIES_VACCINE, 25)];

    const result = service.applyRules(records, BR_RULE);

    expect(result.status).toBe(ComplianceStatusValue.ELIGIBLE);
    expect(result.reason).toBeNull();
  });

  it('deve retornar INELIGIBLE para vacina antirrábica aplicada há 15 dias — destino BR', () => {
    const records = [makeRecord(RecordType.RABIES_VACCINE, 15)];

    const result = service.applyRules(records, BR_RULE);

    expect(result.status).toBe(ComplianceStatusValue.INELIGIBLE);
    expect(result.reason).toMatch(/Faltam 6 dia\(s\)/);
    expect(result.releaseDate).not.toBeNull();
  });

  it('deve retornar INELIGIBLE quando não há nenhuma vacina registrada', () => {
    const result = service.applyRules([], BR_RULE);

    expect(result.status).toBe(ComplianceStatusValue.INELIGIBLE);
    expect(result.reason).toMatch(/Nenhuma vacina antirrábica registrada/);
  });

  // ── União Europeia (I2) ───────────────────────────────────────────────────

  it('deve retornar INELIGIBLE para vacina há 95 dias sem sorologia — destino EU', () => {
    const records = [makeRecord(RecordType.RABIES_VACCINE, 95)];

    const result = service.applyRules(records, EU_RULE);

    expect(result.status).toBe(ComplianceStatusValue.INELIGIBLE);
    expect(result.reason).toMatch(/Sorologia obrigatória/);
  });

  it('deve retornar ELIGIBLE para vacina + sorologia ambas há 95 dias — destino EU', () => {
    const records = [
      makeRecord(RecordType.RABIES_VACCINE, 95),
      makeRecord(RecordType.SEROLOGY, 95),
    ];

    const result = service.applyRules(records, EU_RULE);

    expect(result.status).toBe(ComplianceStatusValue.ELIGIBLE);
    expect(result.reason).toBeNull();
  });

  it('deve retornar INELIGIBLE para sorologia aplicada há 60 dias — destino EU (waiting period 90 dias)', () => {
    const records = [
      makeRecord(RecordType.RABIES_VACCINE, 95),
      makeRecord(RecordType.SEROLOGY, 60),
    ];

    const result = service.applyRules(records, EU_RULE);

    expect(result.status).toBe(ComplianceStatusValue.INELIGIBLE);
    expect(result.reason).toMatch(/Faltam 30 dia\(s\)/);
  });

  // ── Japão (I3) ────────────────────────────────────────────────────────────

  it('deve retornar INELIGIBLE para sorologia há 90 dias — destino JP (waiting period 180 dias)', () => {
    const records = [
      makeRecord(RecordType.RABIES_VACCINE, 185),
      makeRecord(RecordType.SEROLOGY, 90),
    ];

    const result = service.applyRules(records, JP_RULE);

    expect(result.status).toBe(ComplianceStatusValue.INELIGIBLE);
    expect(result.reason).toMatch(/Faltam 90 dia\(s\)/);
  });

  it('deve retornar ELIGIBLE para vacina + sorologia ambas há 185 dias — destino JP', () => {
    const records = [
      makeRecord(RecordType.RABIES_VACCINE, 185),
      makeRecord(RecordType.SEROLOGY, 185),
    ];

    const result = service.applyRules(records, JP_RULE);

    expect(result.status).toBe(ComplianceStatusValue.ELIGIBLE);
    expect(result.reason).toBeNull();
  });
});
