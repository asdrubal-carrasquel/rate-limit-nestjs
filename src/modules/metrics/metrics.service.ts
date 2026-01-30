import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { RateLimitMetric } from './entities/rate-limit-metric.entity';
import { MetricsQueryDto, TimeRange } from './dto/metrics-query.dto';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(RateLimitMetric)
    private metricsRepository: Repository<RateLimitMetric>,
  ) {}

  async recordMetric(
    clientId: string,
    resource: string | undefined,
    userId: string | undefined,
    requestCount: number,
    limit: number,
    wasLimited: boolean,
  ): Promise<RateLimitMetric> {
    const metric = this.metricsRepository.create({
      clientId,
      resource: resource || null,
      userId: userId || null,
      requestCount,
      limit,
      wasLimited,
    });

    return this.metricsRepository.save(metric);
  }

  async getClientMetrics(
    clientId: string,
    query: MetricsQueryDto,
  ): Promise<{
    totalRequests: number;
    limitedRequests: number;
    averageRequests: number;
    peakRequests: number;
    metrics: RateLimitMetric[];
  }> {
    const { startDate, endDate, timeRange, resource } = query;

    let dateStart: Date;
    let dateEnd: Date = new Date();

    if (timeRange) {
      dateStart = this.getStartDateForRange(timeRange);
    } else if (startDate) {
      dateStart = new Date(startDate);
      dateEnd = endDate ? new Date(endDate) : new Date();
    } else {
      // Default: last 24 hours
      dateStart = new Date();
      dateStart.setHours(dateStart.getHours() - 24);
    }

    const where: any = {
      clientId,
      createdAt: Between(dateStart, dateEnd),
    };

    if (resource) {
      where.resource = resource;
    }

    const metrics = await this.metricsRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 1000,
    });

    const totalRequests = metrics.reduce(
      (sum, m) => sum + m.requestCount,
      0,
    );
    const limitedRequests = metrics.filter((m) => m.wasLimited).length;
    const averageRequests =
      metrics.length > 0 ? totalRequests / metrics.length : 0;
    const peakRequests = Math.max(
      ...metrics.map((m) => m.requestCount),
      0,
    );

    return {
      totalRequests,
      limitedRequests,
      averageRequests: Math.round(averageRequests * 100) / 100,
      peakRequests,
      metrics: metrics.slice(0, 100), // Return last 100 for detail
    };
  }

  private getStartDateForRange(timeRange: TimeRange): Date {
    const now = new Date();
    const start = new Date(now);

    switch (timeRange) {
      case TimeRange.HOUR:
        start.setHours(start.getHours() - 1);
        break;
      case TimeRange.DAY:
        start.setHours(start.getHours() - 24);
        break;
      case TimeRange.WEEK:
        start.setDate(start.getDate() - 7);
        break;
      case TimeRange.MONTH:
        start.setMonth(start.getMonth() - 1);
        break;
    }

    return start;
  }

  async getTopResources(
    clientId: string,
    limit: number = 10,
  ): Promise<Array<{ resource: string; count: number }>> {
    const metrics = await this.metricsRepository
      .createQueryBuilder('metric')
      .select('metric.resource', 'resource')
      .addSelect('COUNT(*)', 'count')
      .where('metric.clientId = :clientId', { clientId })
      .andWhere('metric.resource IS NOT NULL')
      .groupBy('metric.resource')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return metrics.map((m) => ({
      resource: m.resource,
      count: parseInt(m.count, 10),
    }));
  }

  async cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.metricsRepository.delete({
      createdAt: LessThanOrEqual(cutoffDate),
    });

    return result.affected || 0;
  }
}
