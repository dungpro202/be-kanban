import { PartialType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';
import { IsBoolean, IsDateString, IsInt, IsOptional, ValidateIf } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsInt()
  position?: number; // Dành cho kéo thả

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean; // Lưu trữ task

  @IsOptional()
  // 👇 Thêm dòng ValidateIf này để NestJS cho phép giá trị null lọt qua IsDateString
  @ValidateIf((object, value) => value !== null) 
  @IsDateString()
  dueDate?: string | null; // 👈 Nhớ thêm "| null" vào type
}