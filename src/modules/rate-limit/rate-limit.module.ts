import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RateLimitService } from './rate-limit.service';
import { RateLimitController } from './rate-limit.controller';
import { RateLimitConfig } from './entities/rate-limit-config.entity';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RateLimitConfig]),
    RedisModule,
    AuthModule,
    MetricsModule,
  ],
  controllers: [RateLimitController],
  providers: [RateLimitService],
  exports: [RateLimitService],
})
export class RateLimitModule {}
