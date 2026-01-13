import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsInt()
  position?: number; // Dành cho kéo thả

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean; // Lưu trữ task
}