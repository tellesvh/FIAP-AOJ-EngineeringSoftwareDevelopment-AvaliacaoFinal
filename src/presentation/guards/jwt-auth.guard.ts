import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard de autenticação JWT.
 * Aplique com @UseGuards(JwtAuthGuard) em qualquer controller ou rota
 * que exija um token Bearer válido no header Authorization.
 *
 * Padrão GRASP Low Coupling: o guard depende apenas da estratégia Passport,
 * sem acoplamento direto aos controllers ou use cases.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
