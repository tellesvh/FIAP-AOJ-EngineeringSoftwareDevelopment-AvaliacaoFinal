import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../presentation/strategies/jwt.strategy';
import { JwtAuthGuard } from '../presentation/guards/jwt-auth.guard';

/** Módulo de autenticação JWT para os atores da plataforma iPet. */
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'ipet-dev-secret',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  providers: [JwtStrategy, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
