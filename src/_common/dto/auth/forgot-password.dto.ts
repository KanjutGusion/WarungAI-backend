import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: "User's email address",
    example: 'email@contoh.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Current password',
    example: '********',
  })
  oldPassword: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  @ApiProperty({
    description: 'New password, must be at least 8 characters',
    example: 'Minimal 8 karakter',
  })
  newPassword: string;
}
