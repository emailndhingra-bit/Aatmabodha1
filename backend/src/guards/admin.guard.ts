import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const adminEmails = (
      process.env.ADMIN_EMAILS ||
      'emailndhingra@gmail.com,amol.xlri@gmail.com'
    )
      .split(',')
      .map((e) => e.trim());
    if (!user || !adminEmails.includes(user.email)) {
      throw new ForbiddenException('Admin access only');
    }
    return true;
  }
}
