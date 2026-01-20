import { PartialType } from '@nestjs/mapped-types';
import { CreateColumnDto } from './create-column.dto';
import { IsInt, IsOptional } from 'class-validator';

// Kế thừa tất cả của Create, nhưng chuyển thành Optional
export class UpdateColumnDto extends PartialType(CreateColumnDto) {
    @IsOptional()
    @IsInt()
    position?: number; // Cho phép update vị trí (để dành cho tính năng kéo thả sau này)
}