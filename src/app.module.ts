import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { BoardModule } from './board/board.module';
import { ColumnModule } from './column/column.module';
import { TaskModule } from './task/task.module';

@Module({
  imports: [PrismaModule, UserModule, AuthModule, BoardModule, ColumnModule, TaskModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
