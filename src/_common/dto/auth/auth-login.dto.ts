import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AuthLoginDto {
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
}
