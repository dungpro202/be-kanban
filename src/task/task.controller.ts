import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';

@UseGuards(JwtGuard)
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @Post()
  create(
    @GetUser('id') userId: number,
    @Body() createTaskDto: CreateTaskDto
  ) {
    return this.taskService.create(userId, createTaskDto);
  }

  @Get()
  findAll(@Query('columnId') columnId?: string) { // Query params luôn là string
    return this.taskService.findAll(columnId ? +columnId : undefined);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findOne(id);
  }

  // @Patch(':id')
  // update(
  //   @Param('id', ParseIntPipe) id: number, 
  //   @Body() updateTaskDto: UpdateTaskDto) {
  //   return this.taskService.update(id, updateTaskDto);
  // }

  // 1. SỬA THÔNG TIN CƠ BẢN (Title, Desc...) KHÔNG CHUYỂN CỘT
  // URL: PATCH /tasks/1
  @Patch(':id')
  updateInfo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto // DTO này loại bỏ field assigneeId, columnId, position 
  ) {
    return this.taskService.update(id, dto);
  }

  // 2. API GÁN NGƯỜI (Assign)
  // URL: POST /tasks/:id/assign
  @Post(':id/assign')
  assignUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('assigneeId') assigneeId: number // Chỉ nhận đúng 1 tham số này
  ) {
    return this.taskService.assignUser(id, assigneeId);
  }

  // 3. API KÉO THẢ (Move/Reorder) - Logic phức tạp tách riêng
  // URL: Post /tasks/:id/move
  @Post(':id/move')
  moveTask(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { columnId: number; position: number } // Body chỉ cần 2 cái này
  ) {
    return this.taskService.moveTask(id, dto.columnId, dto.position);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.remove(id);
  }
}