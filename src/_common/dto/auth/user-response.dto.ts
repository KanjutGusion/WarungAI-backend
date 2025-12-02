import { ApiProperty } from '@nestjs/swagger';
import { EUserStatus } from 'src/generated/prisma/enums';
import { EUserRole } from 'src/types';
import { UserRoleResponseDto } from './user-role-response.dto';

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clpy1234509876fedcbaazyxw',
  })
  id: string;

  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
    nullable: true,
    required: false,
  })
  username: string | null;

  @ApiProperty({
    description: 'User phone number',
    example: '6281234567890',
    nullable: true,
    required: false,
  })
  phone: string | null;

  @ApiProperty({
    description: "User's email address",
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User account status',
    example: EUserStatus.ACTIVE,
    enum: EUserStatus,
  })
  status: EUserStatus;

  @ApiProperty({
    description: "User's role information",
    type: () => UserRoleResponseDto,
  })
  user_role: UserRoleResponseDto;
}
