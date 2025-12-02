import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from 'src/generated/prisma/client';

@Catch()
export class ErrorFilter implements ExceptionFilter {
  private logger = new Logger(ErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    switch (true) {
      case exception instanceof Prisma.PrismaClientKnownRequestError:
        this.logger.error('Prisma error caught:', exception);
        this.handlePrismaError(exception, response);
        break;
      case exception instanceof HttpException:
        this.logger.error('HTTP error caught:', exception);
        this.handleHttpException(exception, response);
        break;
      default:
        this.logger.error('Unknown error caught:', exception);
        this.handleUnknownError(exception, response);
    }
  }

  private handlePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
    response: Response,
  ) {
    const prismaErrorMap: Record<
      string,
      { statusCode: number; message: string; error: string }
    > = {
      P2002: {
        statusCode: 409,
        message: 'Data already exists. Please use different value.',
        error: 'Duplicate Entry',
      },
      P2003: {
        statusCode: 400,
        message: 'Cannot delete or update: related data exists.',
        error: 'Foreign Key Constraint',
      },
      P2025: {
        statusCode: 404,
        message: 'Record not found.',
        error: 'Not Found',
      },
    };

    const errorResponse = prismaErrorMap[exception.code] || {
      statusCode: 500,
      message: exception.message,
      error: 'Database Error',
    };

    this.logger.error(`Prisma Error [${exception.code}]: ${exception.message}`);

    response
      .status(errorResponse.statusCode)
      .json({ message: errorResponse.message, error: errorResponse.error });
  }

  private handleHttpException(exception: HttpException, response: Response) {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      message = (exceptionResponse as { message: string }).message;
    } else {
      message = exception.message;
    }

    response.status(status).json({
      message,
      error: exception.name,
    });
  }

  private handleUnknownError(exception: unknown, response: Response) {
    let statusCode = 500;
    if (
      exception &&
      typeof exception === 'object' &&
      'statusCode' in exception &&
      typeof (exception as { statusCode: unknown }).statusCode === 'number'
    ) {
      statusCode = (exception as { statusCode: number }).statusCode;
    }
    let message = 'Internal server error';

    if (
      exception &&
      typeof exception === 'object' &&
      'message' in exception &&
      typeof (exception as { message: unknown }).message === 'string'
    ) {
      message = (exception as { message: string }).message;
    }
    this.logger.error('Unknown error:', exception);

    response.status(statusCode).json({
      message,
      error: 'Internal Server Error',
    });
  }
}
