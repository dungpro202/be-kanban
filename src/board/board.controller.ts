import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { UpdateBoardDto } from './dto/update-board.dto';

@UseGuards(JwtGuard) // 🛡️ Bảo vệ toàn bộ Controller này
@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  // POST /boards: Tạo bảng
  @Post()
  create(
    @GetUser('id') userId: number, // 👤 Lấy ID user từ token
    @Body() createBoardDto: CreateBoardDto
  ) {
    return this.boardService.create(userId, createBoardDto);
  }

  // GET /boards: Lấy danh sách bảng
  @Get()
  findAll(@GetUser('id') userId: number) {
    return this.boardService.findAll(userId);
  }
  
  // GET /boards/:id : Lấy chi tiết 1 bảng
  @Get(':id')
  findOne(
      @Param('id', ParseIntPipe) id: number,
      @GetUser('id') userId: number
  ) {
      return this.boardService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number, // 👈 Lấy ID user
    @Body() updateBoardDto: UpdateBoardDto
  ) {
    return this.boardService.update(id, userId, updateBoardDto); // Truyền userId vào service
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') userId: number // 👈 Lấy ID user
  ) {
    return this.boardService.remove(id, userId); // Truyền userId vào service
  }
}