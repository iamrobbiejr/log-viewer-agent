import { Controller, Post, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { MachinesService } from './machines.service';

@Controller('machines/agent-sync')
export class AgentSyncController {
  constructor(private readonly machinesService: MachinesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async syncUrl(@Body() body: { secret: string; url: string }) {
    if (!body.secret || !body.url) {
      throw new NotFoundException('Secret and URL are required');
    }

    try {
      await this.machinesService.updateUrlBySecret(body.secret, body.url);
      return { success: true, message: 'URL synced successfully' };
    } catch (e) {
      throw new NotFoundException('Invalid secret');
    }
  }
}
