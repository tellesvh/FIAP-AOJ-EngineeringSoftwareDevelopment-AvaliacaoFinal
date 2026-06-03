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
import { EmitPetPassDto } from '../../application/dtos/emit-petpass.dto';
import { EmitPetPassUseCase } from '../../application/use-cases/emit-petpass.use-case';
import { EvaluateComplianceUseCase } from '../../application/use-cases/evaluate-compliance.use-case';
import {
  IPetPassRepository,
  PET_PASS_REPOSITORY,
} from '../../domain/interfaces/pet-pass.repository.interface';

/**
 * Controller para o bounded context PET Pass (motor CaaS).
 *
 * Padrão GRASP Controller: único ponto de entrada HTTP para operações
 * do Smart Pet Pass; delega toda lógica de negócio aos use cases,
 * sem implementar regras de compliance diretamente.
 */
@Controller()
export class PetPassController {
  constructor(
    private readonly emitPetPassUseCase: EmitPetPassUseCase,
    private readonly evaluateComplianceUseCase: EvaluateComplianceUseCase,
    @Inject(PET_PASS_REPOSITORY)
    private readonly petPassRepository: IPetPassRepository,
  ) { }

  /**
   * Emite o Smart Pet Pass para um Pet e Destino informados.
   * Dispara o evento PetPassEmitido (Apto) ou ComplianceReprovado (Inapto).
   */
  @Post('pets/:petId/petpass')
  @HttpCode(HttpStatus.OK)
  async emit(@Param('petId') petId: string, @Body() dto: EmitPetPassDto) {
    return this.emitPetPassUseCase.execute(petId, dto.destinationCode);
  }

  /** Consulta o Smart Pet Pass e seu StatusCompliance persistido. */
  @Get('petpass/:id')
  async findOne(@Param('id') id: string) {
    const petPass = await this.petPassRepository.findById(id);
    if (!petPass) throw new NotFoundException(`PetPass ${id} não encontrado.`);
    return petPass;
  }

  /**
   * Reavalia o StatusCompliance de um PetPass existente sem emitir um novo.
   * Útil para verificar se o animal já atingiu o waiting period (período de carência)
   * necessário para o destino original.
   */
  @Post('petpass/:id/compliance')
  @HttpCode(HttpStatus.OK)
  async reevaluate(@Param('id') id: string) {
    return this.evaluateComplianceUseCase.execute(id);
  }
}
