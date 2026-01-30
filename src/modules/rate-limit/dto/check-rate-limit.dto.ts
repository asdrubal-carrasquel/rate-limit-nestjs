import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CheckRateLimitDto {
  @ApiProperty({
    description: 'Identificador único del recurso o endpoint',
    example: 'api/v1/users',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  resource?: string;

  @ApiProperty({
    description: 'Identificador del usuario final (opcional)',
    example: 'user-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  userId?: string;
}
