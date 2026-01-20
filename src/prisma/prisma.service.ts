import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// Import từ đường dẫn mới, không phải '@prisma/client'
// import { PrismaClient } from './generated/prisma/client';
import { PrismaClient } from 'src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'; // Adapter cho PostgreSQL

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = new PrismaPg({
      // TODO: Thay đổi chuỗi kết nối phù hợp với môi trường của bạn
      // Chưa có switch sử dụng biến môi trường được DIRECT_URL
      // Lỗi kết nối khi sử dụng IPV6 với Prisma
      connectionString: process.env.DATABASE_URL || process.env.DIRECT_URL,
    });
    console.log('Prisma adapter created');
    super({ adapter }); // Truyền adapter vào Prisma Client
  }

  async onModuleInit() {
    await this.$connect();
    await console.log('Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
