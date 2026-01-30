import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('clients')
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El nombre del cliente ya existe' })
  async create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los clientes' })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  async findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  @ApiParam({ name: 'id', description: 'ID del cliente' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiParam({ name: 'id', description: 'ID del cliente' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un cliente' })
  @ApiParam({ name: 'id', description: 'ID del cliente' })
  @ApiResponse({ status: 204, description: 'Cliente eliminado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Post(':id/api-keys')
  @ApiOperation({ summary: 'Crear una nueva API Key para un cliente' })
  @ApiParam({ name: 'id', description: 'ID del cliente' })
  @ApiResponse({
    status: 201,
    description: 'API Key creada. IMPORTANTE: Guarda la key mostrada, no se mostrará de nuevo.',
  })
  async createApiKey(
    @Param('id') clientId: string,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    return this.clientsService.createApiKey(clientId, createApiKeyDto);
  }

  @Get(':id/api-keys')
  @ApiOperation({ summary: 'Obtener todas las API Keys de un cliente' })
  @ApiParam({ name: 'id', description: 'ID del cliente' })
  @ApiResponse({ status: 200, description: 'Lista de API Keys' })
  async getApiKeys(@Param('id') clientId: string) {
    return this.clientsService.getClientApiKeys(clientId);
  }

  @Post('api-keys/:apiKeyId/revoke')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revocar una API Key' })
  @ApiParam({ name: 'apiKeyId', description: 'ID de la API Key' })
  @ApiResponse({ status: 204, description: 'API Key revocada' })
  async revokeApiKey(@Param('apiKeyId') apiKeyId: string) {
    return this.clientsService.revokeApiKey(apiKeyId);
  }

  @Post('api-keys/:apiKeyId/activate')
  @ApiOperation({ summary: 'Activar una API Key' })
  @ApiParam({ name: 'apiKeyId', description: 'ID de la API Key' })
  @ApiResponse({ status: 200, description: 'API Key activada' })
  async activateApiKey(@Param('apiKeyId') apiKeyId: string) {
    return this.clientsService.activateApiKey(apiKeyId);
  }
}
