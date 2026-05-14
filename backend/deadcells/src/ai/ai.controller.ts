import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('embedding')
  async getEmbedding(@Body('text') text: string) {
    return this.aiService.generateEmbedding(text);
  }

  @Post('moderate')
  async moderateText(@Body('text') text: string) {
    return this.aiService.moderateText(text);
  }

  @Post('suggest')
  async getSuggestion(@Body('prompt') prompt: string) {
    return this.aiService.generateSuggestion(prompt);
  }

  @Post('generate-description')
  async generateDescription(@Body() body: { imageBase64: string, category: string }) {
    return this.aiService.generateDescription(body.imageBase64, body.category);
  }

  @Post('suggest-price')
  async suggestPrice(@Body() body: { imageBase64: string, category: string, condition: string, description: string }) {
    return this.aiService.suggestPrice(body.imageBase64, body.category, body.condition, body.description);
  }

  @Post('analyze-image-quality')
  async analyzeImageQuality(@Body() body: { imageBase64: string, category: string }) {
    return this.aiService.analyzeImageQuality(body.imageBase64, body.category);
  }
}
