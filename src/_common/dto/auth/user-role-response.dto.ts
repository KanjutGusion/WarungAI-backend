import { ApiProperty } from '@nestjs/swagger';
import { EUserStatus } from 'src/generated/prisma/enums';
import { EUserRole } from 'src/types';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class UserRoleResponseDto {
  @ApiProperty({
    description: 'ID of the user role',
    example: 'clpy1234567890abcdefghijklmno',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Name of the user role',
    example: EUserRole.SELLER,
    enum: EUserRole,
  })
  name: EUserRole;
}
