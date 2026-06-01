import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private settingsService: SettingsService,
  ) {}

  async checkEmail(email: string): Promise<{ exists: boolean }> {
    const user = await this.usersRepository.findOne({ where: { email } });
    return { exists: !!user };
  }

  async login(loginDto: any): Promise<{ token: string, user: any }> {
    const user = await this.usersRepository.findOne({ where: { email: loginDto.email } });
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnprocessableEntityException({ email: ['The provided credentials do not match our records.'] });
    }

    if (!user.is_active) {
      throw new UnprocessableEntityException({ email: ['Your account has not been activated yet. Please wait for an admin to approve your request.'] });
    }

    const payload = { email: user.email, sub: user.id };
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;

    return {
      token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async requestAccess(dto: any): Promise<{ message: string }> {
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new UnprocessableEntityException({ email: ['The email has already been taken.'] });
    }

    const allowedDomainsStr = await this.settingsService.getValue('allowed_email_domains');
    if (allowedDomainsStr && allowedDomainsStr.trim() !== '') {
      const allowedDomains = allowedDomainsStr.split(',').map(d => d.trim().toLowerCase());
      const emailDomain = dto.email.split('@')[1]?.toLowerCase();
      
      if (!allowedDomains.includes(emailDomain)) {
        throw new UnprocessableEntityException({ email: ['This email domain is not allowed for registration.'] });
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      is_active: false,
      role: 'user',
    });

    await this.usersRepository.save(user);

    return { message: 'Access requested successfully. Please wait for admin approval.' };
  }
}
