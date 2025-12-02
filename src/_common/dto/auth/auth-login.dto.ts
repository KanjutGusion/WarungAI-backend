import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthLoginDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: "User's email address",
    example: 'jane.doe@example.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'strongPassword123',
  })
  password: string;
}
