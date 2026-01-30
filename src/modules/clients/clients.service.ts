import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Client } from './entities/client.entity';
import { ApiKey } from './entities/api-key.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    const existingClient = await this.clientRepository.findOne({
      where: { name: createClientDto.name },
    });

    if (existingClient) {
      throw new ConflictException('Un cliente con este nombre ya existe');
    }

    const client = this.clientRepository.create(createClientDto);
    return this.clientRepository.save(client);
  }

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find({
      relations: ['apiKeys', 'rateLimitConfigs'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['apiKeys', 'rateLimitConfigs'],
    });

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);

    if (updateClientDto.name && updateClientDto.name !== client.name) {
      const existingClient = await this.clientRepository.findOne({
        where: { name: updateClientDto.name },
      });

      if (existingClient) {
        throw new ConflictException('Un cliente con este nombre ya existe');
      }
    }

    Object.assign(client, updateClientDto);
    return this.clientRepository.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.clientRepository.remove(client);
  }

  async createApiKey(
    clientId: string,
    createApiKeyDto: CreateApiKeyDto,
  ): Promise<{ apiKey: ApiKey; key: string }> {
    const client = await this.findOne(clientId);

    // Generate API Key
    const key = `rl_${uuidv4().replace(/-/g, '')}${uuidv4().replace(/-/g, '')}`;

    const apiKey = this.apiKeyRepository.create({
      ...createApiKeyDto,
      key,
      client,
      expiresAt: createApiKeyDto.expiresAt
        ? new Date(createApiKeyDto.expiresAt)
        : null,
    });

    const savedApiKey = await this.apiKeyRepository.save(apiKey);

    // Return the key only once (for security, it won't be shown again)
    return {
      apiKey: savedApiKey,
      key,
    };
  }

  async findApiKeyByKey(key: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { key, isActive: true },
      relations: ['client'],
    });

    if (!apiKey) {
      throw new NotFoundException('API Key no válida o inactiva');
    }

    // Check expiration
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      throw new BadRequestException('API Key ha expirado');
    }

    // Update last used timestamp
    apiKey.lastUsedAt = new Date();
    await this.apiKeyRepository.save(apiKey);

    return apiKey;
  }

  async getClientApiKeys(clientId: string): Promise<ApiKey[]> {
    await this.findOne(clientId);
    return this.apiKeyRepository.find({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeApiKey(apiKeyId: string): Promise<void> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key no encontrada');
    }

    apiKey.isActive = false;
    await this.apiKeyRepository.save(apiKey);
  }

  async activateApiKey(apiKeyId: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id: apiKeyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API Key no encontrada');
    }

    apiKey.isActive = true;
    return this.apiKeyRepository.save(apiKey);
  }
}
