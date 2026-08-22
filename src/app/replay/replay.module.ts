import { Module } from '@nestjs/common';
import { IngestionModule } from '@/app/ingestion/ingestion.module';
import { ReplayController } from './replay.controller';
import { ReplayService } from './replay.service';

@Module({
  imports: [IngestionModule],
  controllers: [ReplayController],
  providers: [ReplayService],
})
export class ReplayModule {}
