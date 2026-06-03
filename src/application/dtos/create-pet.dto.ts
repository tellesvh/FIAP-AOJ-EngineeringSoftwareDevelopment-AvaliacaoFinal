import { IsEnum, IsString, IsDateString, Matches } from 'class-validator';
import { SpeciesType } from '../../domain/enums/species-type.enum';

/** Dados necessários para cadastrar um novo Pet na plataforma iPet. */
export class CreatePetDto {
  @IsString()
  name: string;

  @IsEnum(SpeciesType)
  speciesType: SpeciesType;

  @IsDateString()
  birthDate: string;

  /** Número do microchip implantado no animal (identificador único). */
  @IsString()
  @Matches(/^[A-Za-z0-9]{9,15}$/, {
    message: 'microchip deve ter entre 9 e 15 caracteres alfanuméricos',
  })
  microchip: string;
}
