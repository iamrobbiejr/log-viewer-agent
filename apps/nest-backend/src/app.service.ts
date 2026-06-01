import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiStatus() {
    return {
      status: 'online',
      version: '1.0.0',
      message: 'Log Viewer Agent API',
      timestamp: new Date().toISOString(),
    };
  }
}
