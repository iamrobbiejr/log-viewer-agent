import { Controller, Post, Body, Get, UseGuards, Request, Put, UnprocessableEntityException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  @Post('check-email')
  checkEmail(@Body() body: any) {
    // Basic validation to match Laravel
    if (!body.email || !body.email.endsWith('@lafrontiere.co.zw')) {
      throw new UnprocessableEntityException({ email: ['The email must end with @lafrontiere.co.zw'] });
    }
    return this.authService.checkEmail(body.email);
  }

  @Post('login')
  login(@Body() body: any) {
    if (!body.email || !body.email.endsWith('@lafrontiere.co.zw')) {
      throw new UnprocessableEntityException({ email: ['The email must end with @lafrontiere.co.zw'] });
    }
    return this.authService.login(body);
  }

  @Post('request-access')
  requestAccess(@Body() body: any) {
    if (!body.email || !body.email.endsWith('@lafrontiere.co.zw')) {
      throw new UnprocessableEntityException({ email: ['The email must end with @lafrontiere.co.zw'] });
    }
    if (!body.password || body.password.length < 8) {
      throw new UnprocessableEntityException({ password: ['The password must be at least 8 characters.'] });
    }
    return this.authService.requestAccess(body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    return { message: 'Logged out' };
  }
}

@Controller('user')
export class UserController {
  constructor(@InjectRepository(User) private usersRepository: Repository<User>) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getUser(@Request() req) {
    const { password, ...result } = req.user;
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Put('password')
  async updatePassword(@Request() req, @Body() body: any) {
    const user = await this.usersRepository.findOne({ where: { id: req.user.id } });
    if (!user) {
      throw new UnprocessableEntityException('User not found');
    }
    if (!(await bcrypt.compare(body.current_password, user.password))) {
      throw new UnprocessableEntityException({ current_password: ['The provided password does not match your current password.'] });
    }
    if (!body.password || body.password.length < 8) {
      throw new UnprocessableEntityException({ password: ['The password must be at least 8 characters.'] });
    }

    user.password = await bcrypt.hash(body.password, 10);
    await this.usersRepository.save(user);

    return { message: 'Password updated' };
  }
}
