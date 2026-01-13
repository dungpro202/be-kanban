import { Injectable } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoardService {
  constructor(private prisma: PrismaService) { }

  // 1. TẠO BẢNG MỚI
  async create(userId: number, dto: CreateBoardDto) {
    return this.prisma.board.create({
      data: {
        title: dto.title,
        description: dto.description,
        ownerId: userId, // Gắn người tạo là chủ sở hữu

        // 🔥 MAGIC: Tự động tạo luôn 3 cột mặc định
        columns: {
          create: [
            { title: 'To Do', position: 0 },
            { title: 'In Progress', position: 1 },
            { title: 'Done', position: 2 },
          ],
        },
        // Tự động add user đó vào danh sách thành viên với quyền OWNER
        members: {
          create: [
            { userId: userId, role: 'OWNER' }
          ]
        }
      },
      // Trả về kèm cả columns và members để frontend hiển thị luôn
      include: {
        columns: true,
        members: true,
      },
    });
  }

  // 2. LẤY DANH SÁCH BẢNG CỦA USER
  async findAll(userId: number) {
    return this.prisma.board.findMany({
      where: {
        // Lấy board do mình làm chủ HOẶC mình là thành viên
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } },
        ],
      },
      include: {
        _count: {
          select: {
            columns: true, // Đếm xem board này có bao nhiêu cột
            members: true  // Đếm xem board này có bao nhiêu thành viên
          }
        }
      },
      orderBy: {
        updatedAt: 'desc', // Bảng mới cập nhật lên đầu
      },
    });
  }

  // 3. LẤY CHI TIẾT 1 BẢNG (Kèm cột và tasks)
  async findOne(id: number, userId: number) {
    return this.prisma.board.findFirst({
      where: {
        id: id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } }
        ]
      },
      include: {
        columns: {
          orderBy: { position: 'asc' }, // Sắp xếp cột từ trái qua phải
          include: {
            tasks: {
              orderBy: { position: 'asc' } // Sắp xếp task từ trên xuống dưới
            }
          }
        },
        members: {
          include: { user: true } // Lấy thông tin user của thành viên
        }
      }
    })
  }
}