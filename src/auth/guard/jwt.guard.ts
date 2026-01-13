import { AuthGuard } from '@nestjs/passport';

// Kế thừa từ AuthGuard của Passport, cấu hình sẵn strategy là 'jwt'
export class JwtGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }
}