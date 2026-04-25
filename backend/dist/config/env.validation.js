"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = validateEnv;
function validateEnv(config) {
    const SARVAM_API_KEY = typeof config.SARVAM_API_KEY === 'string' ? config.SARVAM_API_KEY : '';
    return {
        ...config,
        SARVAM_API_KEY,
    };
}
//# sourceMappingURL=env.validation.js.map