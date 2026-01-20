import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'dotenv/config'
// import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  // Todo : 1. Cấu hình CORS tạm thời cho phép Frontend Angular gọi vào
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Todo : 2. Cấu hình Validation toàn cục
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true, // Tự động loại bỏ các field thừa (không khai báo trong DTO) gửi lên
  //   }),
  // );

  // 3. Khởi chạy Server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`----- Server running on port ${port}-----`);
  console.log(`-----CORS enabled for: ${frontendUrl}---`);
}
bootstrap();
