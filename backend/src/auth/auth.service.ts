import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserStatus } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

function adminEmailList(): string[] {
  return (process.env.ADMIN_EMAILS || 'emailndhingra@gmail.com,amol.xlri@gmail.com')
    .split(',')
    .map((e) => e.trim());
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateGoogle(profile: any): Promise<User> {
    const { id, emails, displayName, photos } = profile;
    const email = emails[0].value;
    let user = await this.usersService.findByGoogleId(id);
    if (!user) {
      user = await this.usersService.findByEmail(email);
      if (user) {
        user = await this.usersService.updateUser(user.id, { googleId: id });
      } else {
        const admins = adminEmailList();
        user = await this.usersService.createUser({
          googleId: id,
          email,
          name: displayName,
          picture: photos?.[0]?.value,
          status: admins.includes(email) ? UserStatus.APPROVED : UserStatus.PENDING,
        });
      }
    }
    return user;
  }

  async validateLocal(email: string, password: string): Promise<User> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async register(email: string, password: string, name: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new BadRequestException('Email already registered');
    const hash = await bcrypt.hash(password, 10);
    const status = adminEmailList().includes(email) ? UserStatus.APPROVED : UserStatus.PENDING;
    const user = await this.usersService.createUser({
      email,
      password: hash,
      name,
      status,
    });
    const { password: _pw, ...safe } = user;
    return { message: 'Registration successful', user: safe };
  }

  generateToken(user: User): string {
    return this.jwtService.sign({ sub: user.id, email: user.email });
  }

  isAdmin(email: string): boolean {
    return adminEmailList().includes(email);
  }
}
