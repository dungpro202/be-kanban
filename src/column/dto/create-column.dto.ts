import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateColumnDto {
  @IsNotEmpty({ message: 'Tên cột không được để trống' })
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsInt()
  boardId: number; // Cột này thuộc về bảng nào
}