"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SarvamService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
let SarvamService = class SarvamService {
    cleanText(text) {
        return String(text || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\*\*|__|`|#{1,6}\s?/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 4500);
    }
    async textToSpeech(text, languageCode) {
        const key = process.env.SARVAM_API_KEY || '';
        if (!key.trim()) {
            throw new common_1.BadRequestException('SARVAM_API_KEY is not configured');
        }
        const clean = this.cleanText(text);
        if (!clean)
            throw new common_1.BadRequestException('Empty text for TTS');
        const url = 'https://api.sarvam.ai/text-to-speech';
        const res = await axios_1.default.post(url, {
            inputs: [clean],
            target_language_code: languageCode,
            speaker: 'meera',
            pace: 1.0,
            pitch: 0,
            loudness: 1.5,
            speech_sample_rate: 22050,
            enable_preprocessing: true,
            model: 'bulbul:v1',
        }, {
            headers: {
                'api-subscription-key': key,
                'Content-Type': 'application/json',
            },
            timeout: 120_000,
            validateStatus: () => true,
        });
        if (res.status >= 400) {
            const msg = res.data?.message || res.statusText || 'Sarvam request failed';
            throw new common_1.BadRequestException(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
        const audios = res.data?.audios;
        if (!Array.isArray(audios) || audios.length === 0) {
            throw new common_1.BadRequestException('Sarvam returned no audio');
        }
        const first = audios[0];
        if (typeof first === 'string')
            return first;
        if (first && typeof first.audio_content === 'string')
            return first.audio_content;
        throw new common_1.BadRequestException('Unexpected Sarvam audio payload');
    }
};
exports.SarvamService = SarvamService;
exports.SarvamService = SarvamService = __decorate([
    (0, common_1.Injectable)()
], SarvamService);
//# sourceMappingURL=sarvam.service.js.map