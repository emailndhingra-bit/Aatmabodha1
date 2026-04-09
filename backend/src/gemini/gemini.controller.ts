import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('gemini')
  async geminiProxy(@Body() body: any) {
    return this.geminiService.generateContent(body);
  }

  @Post('gemini-chat')
  async geminiChat(@Body() body: any) {
    return this.geminiService.chat(body);
  }

  @Post('gemini-image')
  async geminiImage(@Body() body: any) {
    return this.geminiService.generateImage(body);
  }
}

