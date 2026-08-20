import { Module } from '@nestjs/common';
import { OpenF1Client } from '@/app/ingestion/openf1-client.service';

@Module({
  providers: [OpenF1Client],
  exports: [OpenF1Client],
})
export class IngestionModule {}
