import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MaxLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({
    description: 'Nombre descriptivo para la API Key',
    example: 'Production API Key',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Fecha de expiración de la API Key (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
