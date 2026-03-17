import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBoardDto } from './dto/create-board.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateBoardDto } from './dto/update-board.dto';

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
        },
        owner: { // 👈 THÊM: Lấy info chủ bảng để hiển thị Avatar người tạo
          select: { id: true, name: true, email: true, avatarUrl: true }
        }
      },
      orderBy: {
        updatedAt: 'desc', // Bảng mới cập nhật lên đầu
      },
    });
  }

  // 3. LẤY CHI TIẾT 1 BẢNG (Kèm cột và tasks)
  async findOne(id: number, userId: number) {
    const board = await this.prisma.board.findFirst({
      where: {
        id: id,
        OR: [
          { ownerId: userId },
          { members: { some: { userId: userId } } }
        ]
      },
      include: {
        columns: {
          // where: { isArchived: false }, // 👈 THÊM: Chỉ lấy task chưa lưu trữ
          orderBy: { position: 'asc' }, // Sắp xếp cột từ trái qua phải
          include: {
            tasks: {
              orderBy: { position: 'asc' }, // Sắp xếp task từ trên xuống dưới
              include: { // Lấy thêm info người được giao việc để hiện avatar trên thẻ task
                assignee: { select: { id: true, name: true, avatarUrl: true } },
                labels: true
              }
            }
          }
        },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } // Lấy thông tin user của thành viên
        }
      }
    })

    if (!board) throw new NotFoundException('Board not found or access denied');
    return board;
  }

  // Giữ nguyên update/remove cơ bản, ta sẽ nâng cấp check quyền sau
  // async update(id: number, updateBoardDto: UpdateBoardDto) {
  //   return this.prisma.board.update({ where: { id }, data: updateBoardDto });
  // }

  // async remove(id: number) {
  //   return this.prisma.board.delete({ where: { id } });
  // }

  // 4. UPDATE (Chỉ chủ bảng mới được sửa thông tin bảng)
  async update(id: number, userId: number, updateBoardDto: UpdateBoardDto) { // 👈 Nhận thêm userId
    // Check xem có phải owner không
    const board = await this.prisma.board.findFirst({
      where: { id, ownerId: userId }
    });

    if (!board) throw new ForbiddenException('Only owner can update board info');

    return this.prisma.board.update({
      where: { id },
      data: updateBoardDto
    });
  }

  // 5. REMOVE (Chỉ chủ bảng mới được xóa)
  async remove(id: number, userId: number) { // 👈 Nhận thêm userId
    const board = await this.prisma.board.findFirst({
      where: { id, ownerId: userId }
    });

    if (!board) throw new ForbiddenException('Only owner can delete board');

    return this.prisma.board.delete({ where: { id } });
  }

  // 6. Thêm thành viên bằng email (Share board)
  async addMemberByEmail(boardId: number, email: string) {
    // 6.1 Tìm user theo email
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng với email này');
    }

    // 6.2 Kiểm tra xem user này đã có trong Board chưa
    const existingMember = await this.prisma.boardMember.findFirst({
      where: { boardId, userId: user.id }
    });

    if (existingMember) {
      throw new BadRequestException('Người dùng này đã là thành viên của bảng');
    }

    // 6.3 Thêm vào bảng BoardMember
    return this.prisma.boardMember.create({
      data: {
        boardId,
        userId: user.id,
        role: 'MEMBER' // Mặc định role là MEMBER
      },
      include: {
        user: {
          select: { id: true, name: true, email: true } // Trả về thông tin user để Frontend hiển thị
        }
      }
    });
  }

}