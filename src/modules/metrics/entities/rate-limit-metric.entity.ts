import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('rate_limit_metrics')
@Index(['clientId', 'createdAt'])
@Index(['clientId', 'resource'])
export class RateLimitMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clientId: string;

  @Column({ nullable: true })
  resource: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'int' })
  requestCount: number;

  @Column({ type: 'int' })
  limit: number;

  @Column({ type: 'boolean' })
  wasLimited: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
