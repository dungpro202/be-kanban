import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret_mac_dinh',
    });
  }

  async validate(payload: any) {
    // Hàm này chạy khi Token hợp lệ.
    // Kết quả trả về sẽ được gắn vào `req.user`
    const user = await this.prisma.user.findUnique({
        where: { id: payload.sub }
    });
    // Loại bỏ password khỏi object trả về để an toàn
    if (user) delete (user as any).password; 
    return user; 
  }
}