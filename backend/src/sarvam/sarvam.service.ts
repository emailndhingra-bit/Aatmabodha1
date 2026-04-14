import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SarvamService {
  cleanText(text: string): string {
    return String(text || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\*\*|__|`|#{1,6}\s?/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 4500);
  }

  async textToSpeech(text: string, languageCode: string): Promise<string> {
    const key = process.env.SARVAM_API_KEY || '';
    if (!key.trim()) {
      throw new BadRequestException('SARVAM_API_KEY is not configured');
    }
    const clean = this.cleanText(text);
    if (!clean) throw new BadRequestException('Empty text for TTS');
    const url = 'https://api.sarvam.ai/text-to-speech';
    const res = await axios.post(
      url,
      {
        inputs: [clean],
        target_language_code: languageCode,
        speaker: 'meera',
        pace: 1.0,
        pitch: 0,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: 'bulbul:v1',
      },
      {
        headers: {
          'api-subscription-key': key,
          'Content-Type': 'application/json',
        },
        timeout: 120_000,
        validateStatus: () => true,
      },
    );
    if (res.status >= 400) {
      const msg = (res.data as any)?.message || res.statusText || 'Sarvam request failed';
      throw new BadRequestException(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    const audios = (res.data as any)?.audios;
    if (!Array.isArray(audios) || audios.length === 0) {
      throw new BadRequestException('Sarvam returned no audio');
    }
    const first = audios[0];
    if (typeof first === 'string') return first;
    if (first && typeof first.audio_content === 'string') return first.audio_content;
    throw new BadRequestException('Unexpected Sarvam audio payload');
  }
}
