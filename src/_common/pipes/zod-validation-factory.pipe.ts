import { Injectable, Type, mixin } from "@nestjs/common";
import { ZodType } from "zod";
import { ValidationService } from "../validation/validation.service";

export function ZodValidationPipeFactory<T>(schema: ZodType<T>): Type<any> {
  @Injectable()
  class MixinZodValidationPipe {
    constructor(private readonly validationService: ValidationService) {}

    transform(value: T) {
      return this.validationService.validate(schema, value);
    }
  }

  return mixin(MixinZodValidationPipe);
}
