import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class CreateClientDto {
  @ApiProperty({
    description: 'Nombre único del cliente',
    example: 'Mi API Externa',
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Descripción del cliente',
    example: 'API de ejemplo para integración',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Email de contacto del cliente',
    example: 'contact@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;
}
