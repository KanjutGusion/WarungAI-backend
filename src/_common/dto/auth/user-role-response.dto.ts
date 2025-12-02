import { ApiProperty } from '@nestjs/swagger';
import { EUserRole } from 'src/types';

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
