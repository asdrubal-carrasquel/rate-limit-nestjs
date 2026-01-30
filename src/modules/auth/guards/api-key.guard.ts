import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientsService } from '../../clients/clients.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private clientsService: ClientsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('API Key no proporcionada');
    }

    try {
      const apiKeyEntity = await this.clientsService.findApiKeyByKey(apiKey);
      request.user = {
        apiKeyId: apiKeyEntity.id,
        clientId: apiKeyEntity.clientId,
        client: apiKeyEntity.client,
        apiKey: apiKeyEntity,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('API Key inválida o expirada');
    }
  }
}
