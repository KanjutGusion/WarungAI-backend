import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { z, ZodType } from "zod";

export const FileValidationSchemas = {
  IMAGE: z.object({
    filename: z.string().min(1, "Filename is required"),
    mimetype: z.enum(
      ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"],
      {
        error: "Invalid image file type. Allowed: PNG, JPEG, SVG, WebP",
      },
    ),
    size: z.number().max(5 * 1024 * 1024, "Image size must be less than 5MB"),
  }),

  AVATAR: z.object({
    filename: z.string().min(1, "Filename is required"),
    mimetype: z.enum(["image/png", "image/jpeg", "image/jpg", "image/webp"], {
      error: "Avatar must be PNG, JPEG, or WebP",
    }),
    size: z.number().max(2 * 1024 * 1024, "Avatar size must be less than 2MB"),
  }),

  DOCUMENT: z.object({
    filename: z.string().min(1, "Filename is required"),
    mimetype: z.enum(
      [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      {
        error: "Document must be PDF or Word format",
      },
    ),
    size: z
      .number()
      .max(10 * 1024 * 1024, "Document size must be less than 10MB"),
  }),

  VIDEO: z.object({
    filename: z.string().min(1, "Filename is required"),
    mimetype: z.enum(["video/mp4", "video/webm", "video/ogg"], {
      error: "Video must be MP4, WebM, or OGG format",
    }),
    size: z.number().max(50 * 1024 * 1024, "Video size must be less than 50MB"),
  }),

  AUDIO: z.object({
    filename: z.string().min(1, "Filename is required"),
    mimetype: z.enum(["audio/mpeg", "audio/wav", "audio/ogg"], {
      error: "Audio must be MP3, WAV, or OGG format",
    }),
    size: z.number().max(20 * 1024 * 1024, "Audio size must be less than 20MB"),
  }),

  ANY: z.object({
    filename: z.string().min(1, "Filename is required"),
    mimetype: z.string().min(1, "File type is required"),
    size: z
      .number()
      .max(100 * 1024 * 1024, "File size must be less than 100MB"),
  }),
} as const;

export type FileValidationType = keyof typeof FileValidationSchemas;
export type FileUploadData<T extends FileValidationType> = z.infer<
  (typeof FileValidationSchemas)[T]
>;

@Injectable()
export class ValidationService {
  validate<T>(schema: ZodType<T>, data: unknown): T {
    if (!data) {
      throw new ForbiddenException("No data provided");
    }

    try {
      return schema.parse(data);
    } catch (error) {
      throw error;
    }
  }

  // Generic file validation with custom schema
  validateFileWithSchema<T>(
    file: Express.Multer.File,
    schema: ZodType<T>,
  ): Express.Multer.File {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const fileData = {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      destination: file.destination,
      path: file.path,
      buffer: file.buffer,
    };

    this.validate(schema, fileData);
    return file;
  }

  validateFile<T extends FileValidationType>(
    file: Express.Multer.File,
    validationType: T,
  ): Express.Multer.File {
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }

    const schema = FileValidationSchemas[validationType];
    const fileData = {
      filename: file.originalname,
      mimetype: file.mimetype as unknown as FileUploadData<T>["mimetype"],
      size: file.size,
    };

    this.validate(schema, fileData);
    return file;
  }

  validateFiles<T extends FileValidationType>(
    files: Express.Multer.File[],
    validationType: T,
  ): Express.Multer.File[] {
    if (!files || files.length === 0) {
      throw new BadRequestException("No files uploaded");
    }

    return files.map((file) => this.validateFile(file, validationType));
  }

  validateMultipleFileTypes(
    fileValidations: Array<{
      file: Express.Multer.File;
      validationType: FileValidationType;
    }>,
  ): Express.Multer.File[] {
    if (!fileValidations || fileValidations.length === 0) {
      throw new BadRequestException("No files to validate");
    }

    return fileValidations.map(({ file, validationType }) =>
      this.validateFile(file, validationType),
    );
  }
}
