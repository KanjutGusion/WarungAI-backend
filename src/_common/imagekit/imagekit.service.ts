import { z } from 'zod';
import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';

export interface ImageKitUploadOptions {
  fileName?: string;
  folder?: string;
  tags?: string[];
  customMetadata?: Record<string, any>;
  isPrivateFile?: boolean;
  useUniqueFileName?: boolean;
  responseFields?: string[];
  extensions?: Array<{
    name: string;
    options: Record<string, any>;
  }>;
  webhookUrl?: string;
  overwriteFile?: boolean;
  overwriteAITags?: boolean;
  overwriteTags?: boolean;
  overwriteCustomMetadata?: boolean;
  customCoordinates?: string;
}

export interface ImageKitUploadResponse {
  fileId: string;
  name: string;
  size: number;
  versionInfo: {
    id: string;
    name: string;
  };
  filePath: string;
  url: string;
  fileType: string;
  height: number;
  width: number;
  thumbnailUrl: string;
  AITags?: Array<{
    name: string;
    confidence: number;
    source: string;
  }>;
  tags?: string[];
  isPrivateFile: boolean;
  customMetadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ImageKitError {
  message: string;
  help: string;
}

const ImageKitUploadSchema = z.object({
  fileName: z.string().optional(),
  folder: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customMetadata: z.record(z.string(), z.string()).optional(),
  isPrivateFile: z.boolean().optional().default(false),
  useUniqueFileName: z.boolean().optional().default(true),
  overwriteFile: z.boolean().optional().default(false),
});

export type ImageKitUploadDto = z.infer<typeof ImageKitUploadSchema>;

@Injectable()
export class ImageKitService {
  private readonly logger = new Logger(ImageKitService.name);
  private readonly imagekit: ImageKit;
  private urlEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    const publicKey = this.configService.get<string>('IMAGEKIT_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('IMAGEKIT_PRIVATE_KEY');
    this.urlEndpoint = this.configService.get<string>('IMAGEKIT_URL_ENDPOINT')!;

    if (!publicKey || !privateKey || !this.urlEndpoint) {
      throw new Error(
        'ImageKit configuration is missing. Please check your environment variables.',
      );
    }

    this.imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint: this.urlEndpoint,
    });

    this.logger.log('ImageKit service initialized successfully');
  }

  /**
   * Upload single file to ImageKit
   */
  async uploadFile(
    file: Express.Multer.File,
    options: ImageKitUploadOptions = {},
  ): Promise<ImageKitUploadResponse> {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (!file.buffer) {
        throw new BadRequestException(
          'File buffer is required for ImageKit upload',
        );
      }

      const uploadParams = {
        file: file.buffer,
        fileName: options.fileName || file.originalname,
        folder: options.folder || '/uploads',
        tags: options.tags || [],
        customMetadata: options.customMetadata || {},
        isPrivateFile: options.isPrivateFile || false,
        useUniqueFileName: options.useUniqueFileName !== false,
        responseFields:
          options.responseFields || 'isPrivateFile,tags,customMetadata,AITags',
        overwriteFile: options.overwriteFile || false,
        overwriteAITags: options.overwriteAITags || true,
        overwriteTags: options.overwriteTags || true,
        overwriteCustomMetadata: options.overwriteCustomMetadata || true,
      };

      this.logger.log(
        `Uploading file: ${uploadParams.fileName} to folder: ${uploadParams.folder}`,
      );

      const result = await this.imagekit.upload(uploadParams);

      this.logger.log(`File uploaded successfully: ${result.fileId}`);

      return {
        ...result,
        filePath: this.urlEndpoint + result.filePath,
      } as unknown as ImageKitUploadResponse;
    } catch (error) {
      this.logger.error('Error uploading file to ImageKit:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      const imagekitError = error as ImageKitError;
      throw new InternalServerErrorException({
        message: 'Failed to upload file to ImageKit',
        error: imagekitError.message || 'Unknown error',
        help: imagekitError.help,
      });
    }
  }

  /**
   * Upload multiple files to ImageKit
   */
  async uploadFiles(
    files: Express.Multer.File[],
    options: ImageKitUploadOptions = {},
  ): Promise<ImageKitUploadResponse[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file, index) =>
      this.uploadFile(file, {
        ...options,
        fileName: options.fileName
          ? `${options.fileName}_${index + 1}`
          : file.originalname,
      }),
    );

    try {
      const results = await Promise.all(uploadPromises);
      this.logger.log(`Successfully uploaded ${results.length} files`);
      return results;
    } catch (error) {
      this.logger.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  /**
   * Delete file from ImageKit
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.imagekit.deleteFile(fileId);
      this.logger.log(`File deleted successfully: ${fileId}`);
    } catch (error) {
      this.logger.error(`Error deleting file ${fileId}:`, error);
      throw new InternalServerErrorException({
        message: 'Failed to delete file from ImageKit',
        fileId,
        error: (error as ImageKitError).message || 'Unknown error',
      });
    }
  }

  /**
   * Delete multiple files from ImageKit
   */
  async deleteFiles(fileIds: string[]): Promise<void> {
    const deletePromises = fileIds.map((fileId) => this.deleteFile(fileId));

    try {
      await Promise.all(deletePromises);
      this.logger.log(`Successfully deleted ${fileIds.length} files`);
    } catch (error) {
      this.logger.error('Error deleting multiple files:', error);
      throw error;
    }
  }
}
