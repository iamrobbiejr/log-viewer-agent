import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MachinesService } from './machines.service';
import { MachinesController } from './machines.controller';
import { AgentSyncController } from './agent-sync.controller';
import { Machine } from './machine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Machine])],
  controllers: [MachinesController, AgentSyncController],
  providers: [MachinesService],
  exports: [MachinesService],
})
export class MachinesModule {}
