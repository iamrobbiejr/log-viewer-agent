import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from './machine.entity';

@Injectable()
export class MachinesService {
  constructor(
    @InjectRepository(Machine)
    private machinesRepository: Repository<Machine>,
  ) {}

  findAll(): Promise<Machine[]> {
    return this.machinesRepository.find({ order: { created_at: 'ASC' } });
  }

  async findOne(id: string): Promise<Machine> {
    const machine = await this.machinesRepository.findOneBy({ id });
    if (!machine) {
      throw new NotFoundException(`Machine #${id} not found`);
    }
    return machine;
  }

  async updateUrlBySecret(secret: string, newUrl: string): Promise<void> {
    const machine = await this.machinesRepository.findOneBy({ secret });
    if (!machine) {
      throw new NotFoundException(`Machine with given secret not found`);
    }
    machine.url = newUrl;
    await this.machinesRepository.save(machine);
  }

  create(machineData: Partial<Machine>): Promise<Machine> {
    const machine = this.machinesRepository.create(machineData);
    return this.machinesRepository.save(machine);
  }

  async update(id: string, machineData: Partial<Machine>): Promise<Machine> {
    const machine = await this.findOne(id);
    this.machinesRepository.merge(machine, machineData);
    return this.machinesRepository.save(machine);
  }

  async remove(id: string): Promise<void> {
    const machine = await this.findOne(id);
    await this.machinesRepository.remove(machine);
  }
}
