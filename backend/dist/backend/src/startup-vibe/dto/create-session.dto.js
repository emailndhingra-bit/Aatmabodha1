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
exports.CreateSessionDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const add_person_dto_1 = require("./add-person.dto");
const INDUSTRIES = [
    'SaaS',
    'D2C',
    'Deeptech',
    'Services',
    'Healthcare',
    'Fintech',
    'Edtech',
    'Other',
];
const STAGES = ['Idea', 'MVP', 'Launched', 'Scaling', 'Mature'];
const FUNDING = ['Bootstrap', 'Pre-seed', 'Seed', 'Series A+', 'Series B+'];
class CreateSessionDto {
}
exports.CreateSessionDto = CreateSessionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)([...INDUSTRIES]),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "industry", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)([...STAGES]),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "stage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)([...FUNDING]),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "fundingStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.people != null),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(2, { message: 'A team must include at least 2 people' }),
    (0, class_validator_1.ArrayMaxSize)(8, { message: 'A team cannot exceed 8 people' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => add_person_dto_1.AddPersonDto),
    __metadata("design:type", Array)
], CreateSessionDto.prototype, "people", void 0);
//# sourceMappingURL=create-session.dto.js.map