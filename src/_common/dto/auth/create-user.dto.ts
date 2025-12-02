import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @ApiProperty({
    description: "User's email address",
    example: 'jane.doe@example.com',
  })
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({
    description: 'User password, must be at least 8 characters',
    example: 'strongPassword123',
  })
  password: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Optional username',
    example: 'janedoe',
    required: false,
  })
  username?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Optional phone number',
    example: '6281234567890',
    required: false,
  })
  phone?: string;
}
