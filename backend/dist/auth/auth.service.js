"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const user_entity_1 = require("../users/user.entity");
const bcrypt = require("bcrypt");
function adminEmailList() {
    return (process.env.ADMIN_EMAILS || 'emailndhingra@gmail.com,amol.xlri@gmail.com')
        .split(',')
        .map((e) => e.trim());
}
let AuthService = class AuthService {
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async validateGoogle(profile) {
        const { id, emails, displayName, photos } = profile;
        const email = emails[0].value;
        let user = await this.usersService.findByGoogleId(id);
        if (!user) {
            user = await this.usersService.findByEmail(email);
            if (user) {
                user = await this.usersService.updateUser(user.id, { googleId: id });
            }
            else {
                const admins = adminEmailList();
                user = await this.usersService.createUser({
                    googleId: id,
                    email,
                    name: displayName,
                    picture: photos?.[0]?.value,
                    status: admins.includes(email) ? user_entity_1.UserStatus.APPROVED : user_entity_1.UserStatus.PENDING,
                });
            }
        }
        return user;
    }
    async validateLocal(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user || !user.password)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return user;
    }
    async register(email, password, name) {
        const existing = await this.usersService.findByEmail(email);
        if (existing)
            throw new common_1.BadRequestException('Email already registered');
        const hash = await bcrypt.hash(password, 10);
        const status = adminEmailList().includes(email) ? user_entity_1.UserStatus.APPROVED : user_entity_1.UserStatus.PENDING;
        const user = await this.usersService.createUser({
            email,
            password: hash,
            name,
            status,
        });
        const { password: _pw, ...safe } = user;
        return { message: 'Registration successful', user: safe };
    }
    generateToken(user) {
        return this.jwtService.sign({ sub: user.id, email: user.email });
    }
    isAdmin(email) {
        return adminEmailList().includes(email);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map