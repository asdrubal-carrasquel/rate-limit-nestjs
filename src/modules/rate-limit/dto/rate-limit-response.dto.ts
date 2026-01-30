import { ApiProperty } from '@nestjs/swagger';

export class RateLimitResponseDto {
  @ApiProperty({
    description: 'Indica si la request está permitida',
    example: true,
  })
  allowed: boolean;

  @ApiProperty({
    description: 'Número de requests restantes en la ventana actual',
    example: 95,
  })
  remaining: number;

  @ApiProperty({
    description: 'Número total de requests permitidos',
    example: 100,
  })
  limit: number;

  @ApiProperty({
    description: 'Timestamp de cuando se reinicia la ventana (Unix)',
    example: 1703123456,
  })
  reset: number;

  @ApiProperty({
    description: 'Tiempo en segundos hasta el reset',
    example: 45,
  })
  resetIn: number;
}
