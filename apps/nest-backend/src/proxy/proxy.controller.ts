import { Controller, Get, Param, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('machines')
@UseGuards(JwtAuthGuard)
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Get()
  async getMachines() {
    return { data: await this.proxyService.pingAllMachines() };
  }

  @Get(':machineId/logs')
  async getLogs(@Param('machineId') machineId: string) {
    try {
      const machine = await this.proxyService.findMachine(machineId);
      const logs = await this.proxyService.getAvailableLogs(machine);
      if (!logs) {
        throw new NotFoundException('Machine offline or unreachable');
      }
      return { data: logs };
    } catch (e) {
      throw new NotFoundException(e.message);
    }
  }

  @Get(':machineId/logs/:date')
  async getLogsForDate(
    @Param('machineId') machineId: string,
    @Param('date') date: string,
    @Query('search') search: string,
    @Query('level') level: string,
    @Query('page') page: string,
    @Query('page_size') page_size: string,
  ) {
    try {
      const machine = await this.proxyService.findMachine(machineId);
      const logs = await this.proxyService.getLogsForDate(machine, date, {
        search,
        level,
        page,
        page_size,
      });
      if (!logs) {
        throw new NotFoundException('Machine offline or unreachable');
      }
      return { data: logs };
    } catch (e) {
      throw new NotFoundException(e.message);
    }
  }
}
