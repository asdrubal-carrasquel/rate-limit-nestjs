import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateClientDto {
  @ApiProperty({
    description: 'Nombre del cliente',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    description: 'Descripción del cliente',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'Email de contacto',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({
    description: 'Estado activo/inactivo',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
