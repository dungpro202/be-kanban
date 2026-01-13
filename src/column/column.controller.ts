// import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
// import { ColumnService } from './column.service';
// import { CreateColumnDto } from './dto/create-column.dto';
// import { UpdateColumnDto } from './dto/update-column.dto';

// @Controller('column')
// export class ColumnController {
//   constructor(private readonly columnService: ColumnService) {}

//   @Post()
//   create(@Body() createColumnDto: CreateColumnDto) {
//     return this.columnService.create(createColumnDto);
//   }

//   @Get()
//   findAll() {
//     return this.columnService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.columnService.findOne(+id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updateColumnDto: UpdateColumnDto) {
//     return this.columnService.update(+id, updateColumnDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.columnService.remove(+id);
//   }
// }

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { ColumnService } from './column.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { JwtGuard } from '../auth/guard/jwt.guard';

@UseGuards(JwtGuard)
@Controller('columns')
export class ColumnController {
  constructor(private readonly columnService: ColumnService) {}

  @Post()
  create(@Body() createColumnDto: CreateColumnDto) {
    return this.columnService.create(createColumnDto);
  }

  // GET /columns?boardId=1
  @Get()
  findAll(@Query('boardId', ParseIntPipe) boardId: number) {
    return this.columnService.findAllByBoard(boardId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.columnService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateColumnDto: UpdateColumnDto // Trong này có chứa position
  ) {
    return this.columnService.update(id, updateColumnDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.columnService.remove(id);
  }
}