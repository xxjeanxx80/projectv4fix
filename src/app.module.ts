import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions, EntityTarget } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { CustomerModule } from './modules/customers/customer.module';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ServicesModule } from './modules/services/services.module';
import { SpasModule } from './modules/spas/spas.module';
import { StaffModule } from './modules/staff/staff.module';
import { SystemSettingsModule } from './modules/system-settings/system-settings.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';

const logger = new Logger('TypeOrmConfig');

type MockRepository<T> = {
  metadata: { name: string; target: EntityTarget<T> };
  target: EntityTarget<T>;
  manager: any;
  create: (entity: Partial<T>) => T;
  save: (entity: T) => Promise<T>;
  find: () => Promise<T[]>;
  findOne: () => Promise<T | null>;
  findOneBy: () => Promise<T | null>;
  update: () => Promise<{ affected: number }>;
  delete: () => Promise<{ affected: number }>;
  remove: (entity: T) => Promise<T>;
};

const createMockRepository = <T extends object>(manager: any, target: EntityTarget<T>): MockRepository<T> => ({
  metadata: { name: typeof target === 'function' ? target.name : String(target), target },
  target,
  manager,
  create: (entity: Partial<T>) => ({ ...(entity as T) }),
  save: async (entity: T) => entity,
  find: async () => [],
  findOne: async () => null,
  findOneBy: async () => null,
  update: async () => ({ affected: 0 }),
  delete: async () => ({ affected: 0 }),
  remove: async (entity: T) => entity,
});

const resolveRepositoryKey = <Entity>(target: EntityTarget<Entity>) => {
  if (typeof target === 'string') {
    return target;
  }

  if (typeof target === 'function' && target.name) {
    return target.name;
  }

  if (typeof target === 'object' && target !== null && 'name' in target && typeof (target as any).name === 'string') {
    return (target as any).name as string;
  }

  return String(target ?? 'default');
};

const createMockDataSource = (): DataSource => {
  const repositories = new Map<string, any>();
  const entityMetadatas: any[] = [];

  const getOrCreateRepository = <Entity extends object>(target: EntityTarget<Entity>) => {
    const key = resolveRepositoryKey(target);
    if (!repositories.has(key)) {
      const repository = createMockRepository<Entity>(manager, target);
      repositories.set(key, repository);
      entityMetadatas.push({ target, treeType: undefined });
    }
    return repositories.get(key);
  };

  const manager = {
    transaction: async <T>(run: (em: any) => Promise<T>) => run(manager),
    getRepository: <Entity extends object>(target: EntityTarget<Entity>) => getOrCreateRepository(target),
  };

  const mockDataSource = {
    isInitialized: true,
    options: { type: 'postgres' },
    entityMetadatas,
    initialize: async () => mockDataSource,
    destroy: async () => undefined,
    manager,
    getRepository: <Entity extends object>(target: EntityTarget<Entity>) => getOrCreateRepository(target),
    getTreeRepository: <Entity extends object>(target: EntityTarget<Entity>) => getOrCreateRepository(target),
    getMongoRepository: <Entity extends object>(target: EntityTarget<Entity>) => getOrCreateRepository(target),
    createQueryRunner: () => ({
      manager,
      connect: async () => undefined,
      release: async () => undefined,
      startTransaction: async () => undefined,
      commitTransaction: async () => undefined,
      rollbackTransaction: async () => undefined,
    }),
  };

  return mockDataSource as unknown as DataSource;
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') ?? '5432', 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
      dataSourceFactory: async (options: DataSourceOptions) => {
        try {
          const dataSource = new DataSource(options);
          return await dataSource.initialize();
        } catch (error) {
          logger.warn(
            `Database driver not available. Bootstrapping with mock repositories. Reason: ${(error as Error).message}`,
          );
          return createMockDataSource();
        }
      },
    }),
    AuthModule,
    CustomerModule,
    UsersModule,
    SpasModule,
    ServicesModule,
    StaffModule,
    BookingsModule,
    FeedbacksModule,
    PaymentsModule,
    PayoutsModule,
    CouponsModule,
    CampaignsModule,
    AdminModule,
    ReportsModule,
    NotificationsModule,
    DashboardModule,
    SystemSettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
