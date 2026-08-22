import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ReplayResponse, ReplayService } from '@/app/replay/replay.service';

@Controller('replay')
export class ReplayController {
  constructor(private readonly replayService: ReplayService) {}

  @Get(':sessionKey/:driverNumber/:lapNumber')
  getReplay(
    @Param('sessionKey', ParseIntPipe) sessionKey: number,
    @Param('driverNumber', ParseIntPipe) driverNumber: number,
    @Param('lapNumber', ParseIntPipe) lapNumber: number,
  ): Promise<ReplayResponse> {
    return this.replayService.getReplay(sessionKey, driverNumber, lapNumber);
  }
}
