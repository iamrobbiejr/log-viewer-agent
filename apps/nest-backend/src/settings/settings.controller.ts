import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../admin/roles.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  async getPublicSettings() {
    const allowedDomains = await this.settingsService.getValue('allowed_email_domains');
    return { allowed_email_domains: allowedDomains || '' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async getAllSettings() {
    const settings = await this.settingsService.getAll();
    return settings;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put()
  async updateSettings(@Body() body: Record<string, string>) {
    await this.settingsService.bulkUpdate(body);
    return { success: true };
  }
}
