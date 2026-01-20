import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) { }

  // 1. TẠO TASK MỚI
  async create(userId: number, dto: CreateTaskDto) {
    // Tính toán vị trí cuối cùng trong cột
    const lastTask = await this.prisma.task.findFirst({
      where: { columnId: dto.columnId },
      orderBy: { position: 'desc' },
    });

    const newPosition = lastTask ? lastTask.position + 1 : 0; // Nếu chưa có task nào thì là 0

    return this.prisma.task.create({
      data: {
        ...dto,
        position: newPosition, // Gán vị trí cuối
        // Lưu ý: dueDate nhận vào là string, Prisma cần Date object
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } }, // Trả về thông tin người được giao việc
        labels: { include: { label: true } } // Trả về cả label (nếu có sau này)
      }
    });
  }

  // 2. LẤY DANH SÁCH TASK (Thường dùng khi filter hoặc search)
  // Thực tế Frontend thường lấy Task thông qua API "Get Board" rồi, 
  // nhưng API này vẫn cần để load riêng lẻ nếu board quá lớn.
  async findAll(columnId?: number) {
    return this.prisma.task.findMany({
      where: columnId ? { columnId } : {}, // Nếu có columnId thì lọc, không thì lấy hết
      orderBy: { position: 'asc' },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } }
      }
    });
  }

  // 3. LẤY CHI TIẾT 1 TASK
  async findOne(id: number) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: true,
        comments: { include: { user: true }, orderBy: { createdAt: 'desc' } }, // Lấy comment mới nhất
        attachments: true,
        labels: { include: { label: true } }
      }
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  // // 4. UPDATE TASK
  // async update(id: number, dto: UpdateTaskDto) {
  //   // Logic Kéo Thả Task (Reorder) rất phức tạp (vì có thể kéo sang cột khác)
  //   // Tạm thời mình chỉ update thông tin cơ bản trước.
  //   // Phần Reorder mình sẽ tách ra hàm riêng sau nhé.

  //   return this.prisma.task.update({
  //     where: { id },
  //     data: {
  //       ...dto,
  //       dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
  //     },
  //   });
  // }

  // 4.// 1. Update thông tin cơ bản (Loại bỏ các trường nhạy cảm nếu lỡ gửi lên)
  async update(id: number, dto: UpdateTaskDto) {
    // Tách riêng các trường không được phép sửa ở đây
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { position, columnId, assigneeId, ...cleanDto } = dto;

    return this.prisma.task.update({
      where: { id },
      data: {
        ...cleanDto, // Chỉ lấy title, description, priority...
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined, // Chuyển dueDate về Date object
      },
      include: { assignee: { select: { id: true, name: true, avatarUrl: true } } }
    });
  }

  // 4.2 Chỉ assign user
  async assignUser(id: number, assigneeId: number | null) {
    return this.prisma.task.update({
      where: { id },
      data: { assigneeId }, // Update mỗi cái này thôi
      include: { assignee: true } // Trả về thông tin user
    });
  }

  // 4.3 Chỉ xử lý kéo thả (Gọi lại hàm reorder cũ)
  async moveTask(id: number, newColumnId: number, newPosition: number) {
    const task = await this.findOne(id);
    // Gọi lại hàm reorder
    return this.reorder(task, newColumnId, newPosition);
  }


  // LOGIC: KÉO THẢ TASK (XỬ LÝ CẢ 2 TRƯỜNG HỢP)
  async reorder(task: any, newColumnId: number, newPosition: number) {
    const operations: any[] = [];
    const oldColumnId = task.columnId;
    const oldPosition = task.position;

    // TRƯỜNG HỢP 1: KÉO TRONG CÙNG 1 CỘT (Same Column)
    if (oldColumnId === newColumnId) {
      // Logic y hệt như kéo cột (Reorder Column)
      if (newPosition > oldPosition) {
        // Kéo xuống dưới: Các thằng ở giữa dịch lên (trừ 1)
        operations.push(this.prisma.task.updateMany({
          where: { columnId: oldColumnId, position: { gt: oldPosition, lte: newPosition }, id: { not: task.id } },
          data: { position: { decrement: 1 } }
        }));
      } else {
        // Kéo lên trên: Các thằng ở giữa dịch xuống (cộng 1)
        operations.push(this.prisma.task.updateMany({
          where: { columnId: oldColumnId, position: { gte: newPosition, lt: oldPosition }, id: { not: task.id } },
          data: { position: { increment: 1 } }
        }));
      }
    }

    // TRƯỜNG HỢP 2: KÉO SANG CỘT KHÁC (Different Column)
    else {
      // Bước 1: Dọn dẹp ở cột cũ (Old Column)
      // Những thằng nằm SAU task cũ phải lùi lại để lấp chỗ trống -> Giảm 1
      operations.push(this.prisma.task.updateMany({
        where: { columnId: oldColumnId, position: { gt: oldPosition } },
        data: { position: { decrement: 1 } }
      }));

      // Bước 2: Dọn chỗ ở cột mới (New Column)
      // Những thằng nằm TỪ vị trí mới trở đi phải nhường chỗ -> Tăng 1
      operations.push(this.prisma.task.updateMany({
        where: { columnId: newColumnId, position: { gte: newPosition } },
        data: { position: { increment: 1 } }
      }));
    }

    // Bước 3: Di chuyển chính task đó vào vị trí mới
    operations.push(this.prisma.task.update({
      where: { id: task.id },
      data: { columnId: newColumnId, position: newPosition },
      include: { assignee: { select: { id: true, name: true, avatarUrl: true } } }
    }));

    // Chạy tất cả trong 1 Transaction (An toàn tuyệt đối)
    // Kết quả trả về là kết quả của lệnh cuối cùng (operations[last]) - chính là cái task vừa update
    const results = await this.prisma.$transaction(operations);
    return results[results.length - 1];
  }


  // 5. DELETE TASK
  async remove(id: number) {
    return this.prisma.task.delete({ where: { id } });
  }
}