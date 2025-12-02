import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class DefaultPaginationDto {
  @ApiProperty({
    description: 'Page number',
    required: false,
    type: Number,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    type: Number,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(String(value), 10))
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
