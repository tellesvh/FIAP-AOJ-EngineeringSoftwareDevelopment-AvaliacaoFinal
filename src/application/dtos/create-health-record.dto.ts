import { IsEnum, IsDateString, IsOptional, IsString } from 'class-validator';
import { RecordType } from '../../domain/enums/record-type.enum';

/** Dados para registrar um RegistroSanitario (vacinação, sorologia, etc.). */
export class CreateHealthRecordDto {
  @IsEnum(RecordType)
  recordType: RecordType;

  /** Data em que o procedimento foi aplicado no animal. */
  @IsDateString()
  appliedAt: string;

  /** Identificador do veterinário responsável pelo registro. */
  @IsOptional()
  @IsString()
  veterinarianId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
