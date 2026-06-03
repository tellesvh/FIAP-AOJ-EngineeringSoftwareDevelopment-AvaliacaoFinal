import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Inject,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreatePetDto } from '../../application/dtos/create-pet.dto';
import { CreateHealthRecordDto } from '../../application/dtos/create-health-record.dto';
import {
  IPetRepository,
  PET_REPOSITORY,
} from '../../domain/interfaces/pet.repository.interface';
import {
  IHealthRecordRepository,
  HEALTH_RECORD_REPOSITORY,
} from '../../domain/interfaces/health-record.repository.interface';

/**
 * Controller para o bounded context de Cadastro de Pets e RegistrosSanitarios.
 *
 * Padrão GRASP Controller: ponto de entrada HTTP para operações com a entidade Pet e
 * RegistroSanitario; delega toda lógica de negócio aos repositórios e use cases.
 */
@Controller('pets')
export class PetsController {
  constructor(
    @Inject(PET_REPOSITORY)
    private readonly petRepository: IPetRepository,
    @Inject(HEALTH_RECORD_REPOSITORY)
    private readonly healthRecordRepository: IHealthRecordRepository,
  ) { }

  /** Cadastra um novo Pet na plataforma iPet. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePetDto) {
    return this.petRepository.save({
      name: dto.name,
      speciesType: dto.speciesType,
      birthDate: dto.birthDate,
      microchip: dto.microchip,
    });
  }

  /** Consulta os dados cadastrais de um Pet pelo seu identificador único. */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const pet = await this.petRepository.findById(id);
    if (!pet) throw new NotFoundException(`Pet ${id} não encontrado.`);
    return pet;
  }

  /** Registra um RegistroSanitario (vacinação antirrábica, sorologia, etc.) para um Pet. */
  @Post(':id/health-records')
  @HttpCode(HttpStatus.CREATED)
  async addHealthRecord(
    @Param('id') petId: string,
    @Body() dto: CreateHealthRecordDto,
  ) {
    const pet = await this.petRepository.findById(petId);
    if (!pet) throw new NotFoundException(`Pet ${petId} não encontrado.`);

    return this.healthRecordRepository.save({
      petId,
      recordType: dto.recordType,
      appliedAt: dto.appliedAt,
      veterinarianId: dto.veterinarianId ?? null,
      notes: dto.notes ?? null,
    });
  }

  /** Lista o histórico de RegistrosSanitarios de um Pet. */
  @Get(':id/health-records')
  async listHealthRecords(@Param('id') petId: string) {
    const pet = await this.petRepository.findById(petId);
    if (!pet) throw new NotFoundException(`Pet ${petId} não encontrado.`);

    return this.healthRecordRepository.findByPetId(petId);
  }
}
