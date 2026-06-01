import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { MachinesService } from '../machines/machines.service';
import { Machine } from '../machines/machine.entity';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    private httpService: HttpService,
    private machinesService: MachinesService,
  ) {}

  async findMachine(machineId: string): Promise<Machine> {
    try {
      const machine = await this.machinesService.findOne(machineId);
      return machine;
    } catch (error) {
      throw new Error(`Machine '${machineId}' is not registered.`);
    }
  }

  private buildUrl(machine: Machine, path: string): string {
    const baseUrl = machine.url.replace(/\/$/, '');
    return `${baseUrl}${path}`;
  }

  private getClientConfig(machine: Machine, params = {}) {
    return {
      headers: {
        'X-Agent-Secret': machine.secret,
        'ngrok-skip-browser-warning': 'true',
      },
      timeout: 15000, // Hardcoded to 15 seconds instead of config for simplicity
      params,
    };
  }

  async getAvailableLogs(machine: Machine) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(this.buildUrl(machine, '/logs'), this.getClientConfig(machine)),
      );
      return response.data;
    } catch (e) {
      this.logger.warn(`Machine unreachable: ${machine.id}`);
      return null;
    }
  }

  async getLogsForDate(machine: Machine, date: string, filters: any) {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          this.buildUrl(machine, `/logs/${date}`),
          this.getClientConfig(machine, {
            search: filters.search,
            level: filters.level,
            page: filters.page || 1,
            page_size: filters.page_size || 500,
          }),
        ),
      );
      return response.data;
    } catch (e) {
      return null;
    }
  }

  async pingAllMachines() {
    const machines = await this.machinesService.findAll();
    const statuses: any[] = [];

    for (const machine of machines) {
      if (!machine.is_active) {
        continue;
      }
      
      try {
        const response = await lastValueFrom(
          this.httpService.get(this.buildUrl(machine, '/health'), this.getClientConfig(machine)),
        );
        const agentInfo = response.data;
        
        statuses.push({
          id: machine.id,
          ip: machine.url,
          port: 8000,
          online: true,
          company_name: agentInfo.company || 'Unknown',
          terminal_name: machine.name, // Use DB name instead of agent name for dashboard
          terminal_category: machine.category,
          machine_hostname: agentInfo.machine_hostname || '',
          location_notes: agentInfo.location_notes || '',
          log_strategy: agentInfo.log_strategy || '',
          agent_version: agentInfo.agent_version || '',
        });
      } catch (e) {
        statuses.push({
          id: machine.id,
          ip: machine.url,
          port: 8000,
          online: false,
          terminal_name: machine.name,
          terminal_category: machine.category,
          company_name: '',
          machine_hostname: '',
          location_notes: '',
          log_strategy: '',
          agent_version: '',
        });
      }
    }

    // Group by category
    const grouped = {};
    statuses.forEach(s => {
      const cat = s.terminal_category;
      if (!grouped[cat]) {
        grouped[cat] = {
          category: cat,
          machines: [],
          online_count: 0,
          total_count: 0,
        };
      }
      grouped[cat].machines.push(s);
      grouped[cat].total_count++;
      if (s.online) grouped[cat].online_count++;
    });

    return {
      grouped: Object.values(grouped),
      flat: statuses,
      summary: {
        total: statuses.length,
        online: statuses.filter(s => s.online).length,
        offline: statuses.filter(s => !s.online).length,
      },
    };
  }
}
