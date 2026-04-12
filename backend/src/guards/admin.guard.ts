import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const adminEmail = process.env.ADMIN_EMAIL || 'emailndhingra@gmail.com';
    if (!user || user.email !== adminEmail) {
      throw new ForbiddenException('Admin access only');
    }
    return true;
  }
}
