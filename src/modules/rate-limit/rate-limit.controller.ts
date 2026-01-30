import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiParam,
} from '@nestjs/swagger';
import { RateLimitService } from './rate-limit.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CurrentClient } from '../auth/decorators/current-client.decorator';
import { CheckRateLimitDto } from './dto/check-rate-limit.dto';
import { CreateRateLimitConfigDto } from './dto/create-rate-limit-config.dto';
import { RateLimitResponseDto } from './dto/rate-limit-response.dto';

@ApiTags('rate-limit')
@Controller('rate-limit')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api-key')
export class RateLimitController {
  constructor(private readonly rateLimitService: RateLimitService) {}

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verificar y aplicar rate limit',
    description:
      'Incrementa el contador y retorna el estado del rate limit. Usa este endpoint en cada request que quieras limitar.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del rate limit',
    type: RateLimitResponseDto,
  })
  @ApiResponse({ status: 401, description: 'API Key inválida' })
  async checkRateLimit(
    @CurrentClient() user: any,
    @Body() checkDto: CheckRateLimitDto,
  ): Promise<RateLimitResponseDto> {
    return this.rateLimitService.checkRateLimit(user.clientId, checkDto);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Obtener estado del rate limit sin incrementar',
    description:
      'Obtiene el estado actual del rate limit sin incrementar el contador. Útil para verificar antes de procesar una request.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del rate limit',
    type: RateLimitResponseDto,
  })
  @ApiResponse({ status: 401, description: 'API Key inválida' })
  async getRateLimitStatus(
    @CurrentClient() user: any,
    @Body() checkDto: CheckRateLimitDto,
  ): Promise<RateLimitResponseDto> {
    return this.rateLimitService.getRateLimitStatus(user.clientId, checkDto);
  }

  @Post('reset')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Resetear el contador de rate limit',
    description: 'Elimina el contador actual para el recurso especificado.',
  })
  @ApiResponse({ status: 204, description: 'Rate limit reseteado' })
  @ApiResponse({ status: 401, description: 'API Key inválida' })
  async resetRateLimit(
    @CurrentClient() user: any,
    @Body() checkDto: CheckRateLimitDto,
  ): Promise<void> {
    return this.rateLimitService.resetRateLimit(user.clientId, checkDto);
  }

  @Post('configs')
  @ApiOperation({ summary: 'Crear una nueva configuración de rate limit' })
  @ApiResponse({ status: 201, description: 'Configuración creada' })
  @ApiResponse({ status: 401, description: 'API Key inválida' })
  async createConfig(
    @CurrentClient() user: any,
    @Body() createDto: CreateRateLimitConfigDto,
  ) {
    return this.rateLimitService.createConfig(user.clientId, createDto);
  }

  @Get('configs')
  @ApiOperation({ summary: 'Obtener todas las configuraciones de rate limit' })
  @ApiResponse({ status: 200, description: 'Lista de configuraciones' })
  @ApiResponse({ status: 401, description: 'API Key inválida' })
  async getConfigs(@CurrentClient() user: any) {
    return this.rateLimitService.getClientConfigs(user.clientId);
  }

  @Patch('configs/:configId')
  @ApiOperation({ summary: 'Actualizar una configuración de rate limit' })
  @ApiParam({ name: 'configId', description: 'ID de la configuración' })
  @ApiResponse({ status: 200, description: 'Configuración actualizada' })
  @ApiResponse({ status: 404, description: 'Configuración no encontrada' })
  async updateConfig(
    @Param('configId') configId: string,
    @Body() updateData: Partial<CreateRateLimitConfigDto>,
  ) {
    return this.rateLimitService.updateConfig(configId, updateData);
  }

  @Delete('configs/:configId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una configuración de rate limit' })
  @ApiParam({ name: 'configId', description: 'ID de la configuración' })
  @ApiResponse({ status: 204, description: 'Configuración eliminada' })
  async deleteConfig(@Param('configId') configId: string) {
    return this.rateLimitService.deleteConfig(configId);
  }
}
