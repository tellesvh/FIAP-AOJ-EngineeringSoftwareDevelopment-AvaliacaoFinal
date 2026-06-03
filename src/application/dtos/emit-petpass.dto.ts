import { IsString, Length } from 'class-validator';

/** Dados para solicitar a emissão de um Smart Pet Pass para um Destino. */
export class EmitPetPassDto {
  /** Código do país de destino da viagem (ex: "BR", "EU", "JP"). */
  @IsString()
  @Length(2, 5)
  destinationCode: string;
}
