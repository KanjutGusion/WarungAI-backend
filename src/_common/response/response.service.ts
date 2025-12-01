import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseService {
  success<T>(payload: T) {
    return {
      payload,
    };
  }

  pagination<T, J>(payload: T, meta: J) {
    return {
      payload,
      meta,
    };
  }
}
