import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { Machine } from './machine.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/machines')
@UseGuards(JwtAuthGuard)
export class MachinesController {
  constructor(private readonly machinesService: MachinesService) {}

  @Get()
  async findAll() {
    const machines = await this.machinesService.findAll();
    return { data: machines };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const machine = await this.machinesService.findOne(id);
    return { data: machine };
  }

  @Post()
  async create(@Body() createMachineDto: Partial<Machine>) {
    const machine = await this.machinesService.create(createMachineDto);
    return { data: machine };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateMachineDto: Partial<Machine>) {
    const machine = await this.machinesService.update(id, updateMachineDto);
    return { data: machine };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.machinesService.remove(id);
    return { data: { success: true } };
  }
}
