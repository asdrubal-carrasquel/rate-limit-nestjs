import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiKey } from './api-key.entity';
import { RateLimitConfig } from '../../rate-limit/entities/rate-limit-config.entity';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  contactEmail: string;

  @OneToMany(() => ApiKey, (apiKey) => apiKey.client, { cascade: true })
  apiKeys: ApiKey[];

  @OneToMany(() => RateLimitConfig, (config) => config.client, { cascade: true })
  rateLimitConfigs: RateLimitConfig[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
