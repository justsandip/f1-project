import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReplayModule } from '@/app/replay/replay.module';
import { validate } from '@/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ReplayModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
