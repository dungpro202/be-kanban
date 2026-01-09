import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Trỏ đúng đường dẫn prisma của bạn
import { AuthDto, RegisterDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Prisma } from 'src/generated/prisma/client';
// import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
// import { Prisma } from '@prisma/client'; // Nhớ import cái này

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {
    console.log('AuthService created');
  }

  // ĐĂNG KÝ
  async register(dto: RegisterDto) {
    // 1. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(dto.password, salt);

    try {
      // 2. Lưu vào DB
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password: hashPassword,
          name: dto.name,
        },
      });
      // // Nếu muốn dùng raw query thì có thể làm như sau:
      // // Nhưng lưu ý là bạn phải chắc chắn về bảo mật và tránh SQL Injection
      // const result = await this.prisma.$executeRaw(
      //   Prisma.sql`INSERT INTO "User" (email, password, name, "updatedAt") VALUES (${dto.email}, ${hashPassword}, ${dto.name}, NOW())`
      // );
      // 3. Trả về token luôn để user đăng nhập ngay
      return this.signToken(user.id, user.email);
    } catch (error) {
      console.log('Prisma error code:', error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Email đã tồn tại');
        }

      }
      throw error;
    }
  }

  // ĐĂNG NHẬP
  async login(dto: AuthDto) {
    // 1. Tìm user
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new ForbiddenException('Sai email hoặc mật khẩu');

    // 2. So sánh password
    const pwMatches = await bcrypt.compare(dto.password, user.password);
    if (!pwMatches) throw new ForbiddenException('Sai email hoặc mật khẩu');

    // 3. Trả về token
    return this.signToken(user.id, user.email);
  }

  // HÀM TẠO TOKEN
  async signToken(userId: number, email: string) {
    const payload = { sub: userId, email };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '1d', // Token hết hạn sau 1 ngày
      secret: process.env.JWT_SECRET,
    });

    return {
      access_token: token,
      user: { id: userId, email } // Trả thêm info để Frontend tiện dùng
    };
  }
}