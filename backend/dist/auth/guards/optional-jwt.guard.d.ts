import { ExecutionContext } from '@nestjs/common';
declare const OptionalJwtGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class OptionalJwtGuard extends OptionalJwtGuard_base {
    canActivate(context: ExecutionContext): true | Promise<boolean>;
    handleRequest(err: any, user: any): any;
}
export {};
