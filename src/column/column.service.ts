// import { Injectable } from '@nestjs/common';
// import { CreateColumnDto } from './dto/create-column.dto';
// import { UpdateColumnDto } from './dto/update-column.dto';

// @Injectable()
// export class ColumnService {
//   create(createColumnDto: CreateColumnDto) {
//     return 'This action adds a new column';
//   }

//   findAll() {
//     return `This action returns all column`;
//   }

//   findOne(id: number) {
//     return `This action returns a #${id} column`;
//   }

//   update(id: number, updateColumnDto: UpdateColumnDto) {
//     return `This action updates a #${id} column`;
//   }

//   remove(id: number) {
//     return `This action removes a #${id} column`;
//   }
// }

import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ColumnService {
  constructor(private prisma: PrismaService) {}

  // 1. TẠO CỘT MỚI
  async create(dto: CreateColumnDto) {
    // SỬA ĐIỂM 1: Tìm vị trí lớn nhất hiện tại thay vì dùng count
    const lastColumn = await this.prisma.column.findFirst({
      where: { boardId: dto.boardId },
      orderBy: { position: 'desc' }
    });

    const newPosition = lastColumn ? lastColumn.position + 1 : 0;

    return this.prisma.column.create({
      data: {
        title: dto.title,
        boardId: dto.boardId,
        position: newPosition, 
      },
      // SỬA ĐIỂM 2: Include mảng tasks rỗng để Frontend không bị lỗi
      include: {
        tasks: true 
      }
    });
  }

  // 2. LẤY DANH SÁCH CỘT THEO BOARD ID
  async findAllByBoard(boardId: number) {
    return this.prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' }, // Sắp xếp theo thứ tự hiển thị
      include: {
        tasks: {
            orderBy: { position: 'asc' } // Lấy kèm luôn tasks bên trong
        }
      }
    });
  }

  // 3. LẤY 1 CỘT (Để check tồn tại)
  async findOne(id: number) {
    const column = await this.prisma.column.findUnique({
      where: { id },
    });
    if (!column) throw new NotFoundException('Không tìm thấy cột');
    return column;
  }

  //4. HÀM UPDATE (Sửa lại để check xem có đổi vị trí không)
  async update(id: number, dto: UpdateColumnDto) {
    const column = await this.findOne(id);

    // Nếu người dùng gửi lên position mới KHÁC position cũ -> Gọi logic Reorder
    if (dto.position !== undefined && dto.position !== column.position) {
      return this.reorder(column.id, column.boardId, column.position, dto.position);
    }

    // Nếu chỉ đổi tên title bình thường
    return this.prisma.column.update({
      where: { id },
      data: dto,
    });
  }

  // 4.1 HÀM REORDER CỘT
  // 🔥 LOGIC KÉO THẢ (REORDER)
  async reorder(columnId: number, boardId: number, oldPosition: number, newPosition: number) {
    const operations: any[] = [];

    // 1. Logic dịch chuyển các cột khác
    if (newPosition > oldPosition) {
      // CASE: Kéo từ TRÁI sang PHẢI (0 -> 2)
      // Giảm position của các cột đứng sau nó (để lấp chỗ trống)
      operations.push(
        this.prisma.column.updateMany({
          where: {
            boardId,
            position: { gt: oldPosition, lte: newPosition }, // Trong khoảng (old, new]
            id: { not: columnId }, // Trừ chính nó ra
          },
          data: { position: { decrement: 1 } }, // Trừ 1
        }),
      );
    } else {
      // CASE: Kéo từ PHẢI sang TRÁI (2 -> 0)
      // Tăng position của các cột đứng trước nó (để nhường chỗ)
      operations.push(
        this.prisma.column.updateMany({
          where: {
            boardId,
            position: { gte: newPosition, lt: oldPosition }, // Trong khoảng [new, old)
            id: { not: columnId },
          },
          data: { position: { increment: 1 } }, // Cộng 1
        }),
      );
    }

    // 2. Cập nhật vị trí cho chính cột đang kéo
    operations.push(
      this.prisma.column.update({
        where: { id: columnId },
        data: { position: newPosition },
      }),
    );

    // 3. Thực thi tất cả trong 1 Transaction
    await this.prisma.$transaction(operations);

    // 4. Trả về kết quả cột sau khi update
    return this.prisma.column.findUnique({ where: { id: columnId } });
  }

  // 5. XÓA CỘT
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.column.delete({
      where: { id },
    });
  }
}