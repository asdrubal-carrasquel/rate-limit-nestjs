import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiQuery,
} from '@nestjs/swagger';
import { MetricsService } from './metrics.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentClient } from '../auth/decorators/current-client.decorator';
import { MetricsQueryDto } from './dto/metrics-query.dto';

@ApiTags('metrics')
@Controller('metrics')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener métricas de rate limiting' })
  @ApiResponse({ status: 200, description: 'Métricas obtenidas exitosamente' })
  @ApiResponse({ status: 401, description: 'API Key inválida' })
  async getMetrics(
    @CurrentClient() user: any,
    @Query() query: MetricsQueryDto,
  ) {
    return this.metricsService.getClientMetrics(user.clientId, query);
  }

  @Get('top-resources')
  @ApiOperation({ summary: 'Obtener los recursos más utilizados' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de recursos a retornar (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Top recursos obtenidos exitosamente',
  })
  @ApiResponse({ status: 401, description: 'API Key inválida' })
  async getTopResources(
    @CurrentClient() user: any,
    @Query('limit') limit?: number,
  ) {
    return this.metricsService.getTopResources(
      user.clientId,
      limit ? parseInt(limit.toString(), 10) : 10,
    );
  }
}
