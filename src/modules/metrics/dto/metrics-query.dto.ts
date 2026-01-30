import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum TimeRange {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class MetricsQueryDto {
  @ApiProperty({
    description: 'Fecha de inicio (ISO 8601)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin (ISO 8601)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Rango de tiempo predefinido',
    enum: TimeRange,
    required: false,
  })
  @IsEnum(TimeRange)
  @IsOptional()
  timeRange?: TimeRange;

  @ApiProperty({
    description: 'Filtrar por recurso específico',
    required: false,
  })
  @IsString()
  @IsOptional()
  resource?: string;
}
