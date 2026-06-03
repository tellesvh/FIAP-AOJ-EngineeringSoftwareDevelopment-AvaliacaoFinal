import { NotFoundException } from '@nestjs/common';
import { EmitPetPassUseCase } from '../../src/application/use-cases/emit-petpass.use-case';
import { ComplianceEngineService } from '../../src/domain/services/compliance-engine.service';
import { ComplianceStatus } from '../../src/domain/value-objects/compliance-status.vo';
import { ComplianceStatusValue } from '../../src/domain/enums/compliance-status.enum';
import { IPetRepository } from '../../src/domain/interfaces/pet.repository.interface';
import { IHealthRecordRepository } from '../../src/domain/interfaces/health-record.repository.interface';
import { IPetPassRepository } from '../../src/domain/interfaces/pet-pass.repository.interface';
import { Pet } from '../../src/domain/entities/pet.entity';
import { PetPass } from '../../src/domain/entities/pet-pass.entity';
import { SpeciesType } from '../../src/domain/enums/species-type.enum';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PET: Pet = {
  id: 'pet-uuid-1',
  name: 'Rex',
  speciesType: SpeciesType.DOG,
  birthDate: '2020-01-01',
  microchip: 'CHIP123456789',
  createdAt: new Date(),
  healthRecords: [],
  petPasses: [],
};

function makeMockPetPass(
  status: ComplianceStatusValue,
  reason: string | null = null,
): PetPass {
  const pass = new PetPass();
  pass.id = 'pass-uuid-1';
  pass.petId = MOCK_PET.id;
  pass.destinationCode = 'BR';
  pass.complianceStatus = status;
  pass.reason = reason;
  pass.releaseDate = null;
  pass.expiresAt = '2026-09-01';
  pass.issuedAt = new Date();
  return pass;
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

describe('EmitPetPassUseCase', () => {
  let useCase: EmitPetPassUseCase;
  let petRepository: jest.Mocked<IPetRepository>;
  let healthRecordRepository: jest.Mocked<IHealthRecordRepository>;
  let petPassRepository: jest.Mocked<IPetPassRepository>;
  let complianceEngine: jest.Mocked<Pick<ComplianceEngineService, 'evaluate' | 'applyRules'>>;

  beforeEach(() => {
    petRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByMicrochip: jest.fn(),
    };

    healthRecordRepository = {
      save: jest.fn(),
      findByPetId: jest.fn().mockResolvedValue([]),
    };

    petPassRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findLatestByPetIdAndDestination: jest.fn(),
    };

    complianceEngine = {
      evaluate: jest.fn(),
      applyRules: jest.fn(),
    };

    useCase = new EmitPetPassUseCase(
      petRepository,
      healthRecordRepository,
      petPassRepository,
      complianceEngine as unknown as ComplianceEngineService,
    );
  });

  it('deve salvar PetPass com status ELIGIBLE quando o pet está em conformidade', async () => {
    petRepository.findById.mockResolvedValue(MOCK_PET);
    complianceEngine.evaluate.mockResolvedValue(ComplianceStatus.eligible());
    petPassRepository.save.mockResolvedValue(
      makeMockPetPass(ComplianceStatusValue.ELIGIBLE),
    );

    const result = await useCase.execute(MOCK_PET.id, 'BR');

    expect(petPassRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        petId: MOCK_PET.id,
        destinationCode: 'BR',
        complianceStatus: ComplianceStatusValue.ELIGIBLE,
        reason: null,
      }),
    );
    expect(result.complianceStatus).toBe(ComplianceStatusValue.ELIGIBLE);
  });

  it('deve salvar PetPass com status INELIGIBLE e motivo quando o pet não está em conformidade', async () => {
    const motivo = 'Nenhuma vacina antirrábica registrada.';
    petRepository.findById.mockResolvedValue(MOCK_PET);
    complianceEngine.evaluate.mockResolvedValue(
      ComplianceStatus.ineligible(motivo),
    );
    petPassRepository.save.mockResolvedValue(
      makeMockPetPass(ComplianceStatusValue.INELIGIBLE, motivo),
    );

    const result = await useCase.execute(MOCK_PET.id, 'BR');

    expect(petPassRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        complianceStatus: ComplianceStatusValue.INELIGIBLE,
        reason: motivo,
      }),
    );
    expect(result.complianceStatus).toBe(ComplianceStatusValue.INELIGIBLE);
    expect(result.reason).toBe(motivo);
  });

  it('deve lançar NotFoundException quando o pet não existe', async () => {
    petRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('id-inexistente', 'BR')).rejects.toThrow(
      NotFoundException,
    );
    expect(petPassRepository.save).not.toHaveBeenCalled();
  });
});
