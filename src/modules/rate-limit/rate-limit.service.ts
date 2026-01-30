import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../redis/redis.service';
import { RateLimitConfig } from './entities/rate-limit-config.entity';
import { CreateRateLimitConfigDto } from './dto/create-rate-limit-config.dto';
import { CheckRateLimitDto } from './dto/check-rate-limit.dto';
import { RateLimitResponseDto } from './dto/rate-limit-response.dto';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class RateLimitService {
  constructor(
    @InjectRepository(RateLimitConfig)
    private rateLimitConfigRepository: Repository<RateLimitConfig>,
    private redisService: RedisService,
    private metricsService: MetricsService,
  ) {}

  async createConfig(
    clientId: string,
    createDto: CreateRateLimitConfigDto,
  ): Promise<RateLimitConfig> {
    const config = this.rateLimitConfigRepository.create({
      ...createDto,
      clientId,
    });

    return this.rateLimitConfigRepository.save(config);
  }

  async getClientConfigs(clientId: string): Promise<RateLimitConfig[]> {
    return this.rateLimitConfigRepository.find({
      where: { clientId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getDefaultConfig(clientId: string): Promise<RateLimitConfig> {
    const configs = await this.getClientConfigs(clientId);

    if (configs.length === 0) {
      // Default config: 100 requests per minute
      return this.rateLimitConfigRepository.create({
        name: 'Default',
        maxRequests: 100,
        windowSeconds: 60,
        clientId,
        isActive: true,
      });
    }

    // Return the first active config as default
    return configs[0];
  }

  async checkRateLimit(
    clientId: string,
    checkDto: CheckRateLimitDto,
  ): Promise<RateLimitResponseDto> {
    const config = await this.getDefaultConfig(clientId);

    // Build Redis key
    const keyParts = [
      'rate_limit',
      clientId,
      config.id,
      checkDto.resource || 'default',
      checkDto.userId || 'default',
    ];
    const redisKey = keyParts.join(':');

    // Get current count
    const currentCount = await this.redisService.increment(redisKey);

    // Set expiration if this is the first request in the window
    if (currentCount === 1) {
      await this.redisService.expire(redisKey, config.windowSeconds);
    }

    // Get TTL to calculate reset time
    const ttl = await this.redisService.ttl(redisKey);
    const resetTime = Math.floor(Date.now() / 1000) + ttl;

    const allowed = currentCount <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - currentCount);

    // Record metric
    await this.metricsService.recordMetric(
      clientId,
      checkDto.resource,
      checkDto.userId,
      currentCount,
      config.maxRequests,
      !allowed,
    );

    return {
      allowed,
      remaining,
      limit: config.maxRequests,
      reset: resetTime,
      resetIn: ttl,
    };
  }

  async getRateLimitStatus(
    clientId: string,
    checkDto: CheckRateLimitDto,
  ): Promise<RateLimitResponseDto> {
    const config = await this.getDefaultConfig(clientId);

    // Build Redis key
    const keyParts = [
      'rate_limit',
      clientId,
      config.id,
      checkDto.resource || 'default',
      checkDto.userId || 'default',
    ];
    const redisKey = keyParts.join(':');

    // Get current count without incrementing
    const currentCountStr = await this.redisService.get(redisKey);
    const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

    // Get TTL
    const ttl = await this.redisService.ttl(redisKey);
    const resetTime = ttl > 0 ? Math.floor(Date.now() / 1000) + ttl : 0;

    const allowed = currentCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - currentCount);

    return {
      allowed,
      remaining,
      limit: config.maxRequests,
      reset: resetTime,
      resetIn: ttl,
    };
  }

  async resetRateLimit(
    clientId: string,
    checkDto: CheckRateLimitDto,
  ): Promise<void> {
    const config = await this.getDefaultConfig(clientId);

    const keyParts = [
      'rate_limit',
      clientId,
      config.id,
      checkDto.resource || 'default',
      checkDto.userId || 'default',
    ];
    const redisKey = keyParts.join(':');

    await this.redisService.delete(redisKey);
  }

  async updateConfig(
    configId: string,
    updateData: Partial<CreateRateLimitConfigDto>,
  ): Promise<RateLimitConfig> {
    const config = await this.rateLimitConfigRepository.findOne({
      where: { id: configId },
    });

    if (!config) {
      throw new NotFoundException('Configuración de rate limit no encontrada');
    }

    Object.assign(config, updateData);
    return this.rateLimitConfigRepository.save(config);
  }

  async deleteConfig(configId: string): Promise<void> {
    const config = await this.rateLimitConfigRepository.findOne({
      where: { id: configId },
    });

    if (!config) {
      throw new NotFoundException('Configuración de rate limit no encontrada');
    }

    await this.rateLimitConfigRepository.remove(config);
  }
}
