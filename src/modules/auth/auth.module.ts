import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { ApiKeyGuard } from './guards/api-key.guard';

@Module({
  imports: [ClientsModule],
  providers: [ApiKeyGuard],
  exports: [ApiKeyGuard],
})
export class AuthModule {}
