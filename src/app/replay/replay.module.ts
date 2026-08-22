import { Module } from '@nestjs/common';
import { IngestionModule } from '@/app/ingestion/ingestion.module';
import { ReplayController } from '@/app/replay/replay.controller';
import { ReplayService } from '@/app/replay/replay.service';

@Module({
  imports: [IngestionModule],
  controllers: [ReplayController],
  providers: [ReplayService],
})
export class ReplayModule {}
