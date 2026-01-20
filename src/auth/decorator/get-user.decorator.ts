import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // 1. Lấy request từ context
    const request = ctx.switchToHttp().getRequest();
    
    // 2. request.user đã được JwtStrategy gắn vào sau khi check token thành công
    // Nếu gọi @GetUser('email') -> trả về email
    if (data) {
      return request.user[data];
    }
    
    // Nếu gọi @GetUser() -> trả về cả object user
    return request.user;
  },
);