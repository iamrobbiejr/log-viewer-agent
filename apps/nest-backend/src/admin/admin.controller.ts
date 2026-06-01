import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, UnprocessableEntityException, BadRequestException, Request } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import * as bcrypt from 'bcrypt';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  @Get()
  async findAll() {
    return this.usersRepository.find({ order: { created_at: 'DESC' } });
  }

  @Post()
  async create(@Body() body: any) {
    if (!body.name || !body.email || !body.password) {
      throw new UnprocessableEntityException('Missing fields');
    }
    if (!body.email.endsWith('@lafrontiere.co.zw')) {
      throw new UnprocessableEntityException({ email: ['Email must end with @lafrontiere.co.zw'] });
    }

    const existing = await this.usersRepository.findOne({ where: { email: body.email } });
    if (existing) {
      throw new UnprocessableEntityException({ email: ['Email already in use'] });
    }

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = this.usersRepository.create({
      name: body.name,
      email: body.email,
      password: hashedPassword,
      is_active: true,
      role: 'admin',
    });

    await this.usersRepository.save(user);
    return { message: 'Admin created successfully', user };
  }

  @Put(':id/activate')
  async toggleActive(@Param('id') id: number, @Request() req) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new BadRequestException('User not found');
    
    if (user.id === req.user.id) {
      throw new BadRequestException('Cannot deactivate yourself.');
    }

    user.is_active = !user.is_active;
    await this.usersRepository.save(user);

    return { message: 'User status updated', user };
  }

  @Delete(':id')
  async remove(@Param('id') id: number, @Request() req) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new BadRequestException('User not found');
    
    if (user.id === req.user.id) {
      throw new BadRequestException('Cannot delete yourself.');
    }

    await this.usersRepository.remove(user);
    return { message: 'User deleted' };
  }
}
