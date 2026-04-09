import { Controller, Post, Get, Body, UseGuards, Req, Res, Param, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; name: string }) {
    return this.authService.register(body.email, body.password, body.name);
  }

  @Post('login')
  @UseGuards(AuthGuard('local'))
  async login(@Req() req: any) {
    const user = req.user;
    if (user.status === 'pending') {
      throw new UnauthorizedException('Your account is pending admin approval.');
    }
    if (user.status === 'rejected') {
      throw new UnauthorizedException('Your account has been rejected.');
    }
    const token = this.authService.generateToken(user);
    return { token, user };
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    const user = req.user;
    const token = this.authService.generateToken(user);
    const frontendUrl = process.env.FRONTEND_URL || 'https://aatmabodha1.onrender.com';
    if (user.status === 'pending') {
      return res.redirect(`${frontendUrl}/auth/pending`);
    }
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() req: any) {
    return req.user;
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard)
  async getPendingUsers(@Req() req: any) {
    if (!this.authService.isAdmin(req.user.email)) {
      throw new UnauthorizedException('Admin only');
    }
    return this.usersService.getAllPendingUsers();
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard)
  async getAllUsers(@Req() req: any) {
    if (!this.authService.isAdmin(req.user.email)) {
      throw new UnauthorizedException('Admin only');
    }
    return this.usersService.getAllUsers();
  }

  @Post('admin/approve/:id')
  @UseGuards(JwtAuthGuard)
  async approveUser(@Req() req: any, @Param('id') id: string) {
    if (!this.authService.isAdmin(req.user.email)) {
      throw new UnauthorizedException('Admin only');
    }
    return this.usersService.approveUser(id);
  }

  @Post('admin/reject/:id')
  @UseGuards(JwtAuthGuard)
  async rejectUser(@Req() req: any, @Param('id') id: string) {
    if (!this.authService.isAdmin(req.user.email)) {
      throw new UnauthorizedException('Admin only');
    }
    return this.usersService.rejectUser(id);
  }
}
