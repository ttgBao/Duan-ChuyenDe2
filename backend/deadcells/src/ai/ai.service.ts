import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const FormData = require('form-data');

@Injectable()
export class AiService {
  private readonly aiServiceUrl: string;

  constructor(private readonly httpService: HttpService) {
    let url = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000/api/ai';
    url = url.trim().replace(/\/$/, '');
    if (!url.endsWith('/api/ai')) {
      url = `${url}/api/ai`;
    }
    this.aiServiceUrl = url;
  }

  async generateEmbedding(text: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/embedding`, { text })
      );
      return response.data;
    } catch (error) {
      throw new HttpException('AI Service Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async moderateText(text: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/moderate`, { text })
      );
      return response.data;
    } catch (error) {
      throw new HttpException('AI Service Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async generateSuggestion(prompt: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/generate`, { prompt })
      );
      return response.data;
    } catch (error) {
      throw new HttpException('AI Service Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async matchProducts(targetProductText: string, candidates: { id: number, text: string }[]) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/match-products`, {
          target_product_text: targetProductText,
          candidates: candidates
        })
      );
      return response.data;
    } catch (error) {
      throw new HttpException('AI Service Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async generateDescription(imageBase64: string, category: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/generate-description`, {
          imageBase64,
          category,
        }, {
          timeout: 60000,
        })
      );
      return response.data;
    } catch (error) {
      const detail = error?.response?.data?.detail || error?.message || 'AI Description Error';
      throw new HttpException(detail, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async suggestPrice(imageBase64: string, category: string, condition: string, description: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/suggest-price`, {
          imageBase64,
          category,
          condition,
          description,
        }, {
          timeout: 60000,
        })
      );
      return response.data;
    } catch (error) {
      const detail = error?.response?.data?.detail || error?.message || 'AI Pricing Error';
      throw new HttpException(detail, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async analyzeImageQuality(imageBase64: string, category: string) {
    try {
      const response = await lastValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/analyze-image-quality`, {
          imageBase64,
          category,
        }, {
          timeout: 60000,
        })
      );
      return response.data;
    } catch (error) {
      const detail = error?.response?.data?.detail || error?.message || 'AI Analysis Error';
      throw new HttpException(detail, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
