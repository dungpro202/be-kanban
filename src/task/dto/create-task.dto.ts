import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { Priority } from 'src/generated/prisma/browser';
// import { Priority } from '@prisma/client'; // Import Enum từ Prisma

export class CreateTaskDto {
  @IsNotEmpty({ message: 'Tiêu đề task không được để trống' })
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsInt()
  columnId: number; // Task này thuộc cột nào

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority; // LOW, MEDIUM, HIGH

  @IsOptional()
  @IsDateString() 
  dueDate?: string; // Gửi lên dạng chuỗi ISO-8601 (ví dụ: "2024-12-31T00:00:00Z")

  @IsOptional()
  @IsInt()
  assigneeId?: number; // Giao việc cho ai (User ID)
}