import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import { ProxyController } from './proxy.controller';
import { MachinesModule } from '../machines/machines.module';

@Module({
  imports: [
    HttpModule,
    MachinesModule,
  ],
  providers: [ProxyService],
  controllers: [ProxyController],
})
export class ProxyModule {}
