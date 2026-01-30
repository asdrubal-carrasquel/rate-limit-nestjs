import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, Max, MaxLength } from 'class-validator';

export class CreateRateLimitConfigDto {
  @ApiProperty({
    description: 'Nombre de la configuración',
    example: 'API General - 100 req/min',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Descripción de la configuración',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Número máximo de requests permitidos',
    example: 100,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  maxRequests: number;

  @ApiProperty({
    description: 'Ventana de tiempo en segundos',
    example: 60,
    minimum: 1,
    maximum: 86400,
  })
  @IsInt()
  @Min(1)
  @Max(86400)
  windowSeconds: number;
}
