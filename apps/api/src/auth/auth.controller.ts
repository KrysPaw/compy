import { Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service.js';
import { buildSessionCookie } from './session-auth.guard.js';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('guest')
  @ApiOperation({ summary: 'Create a guest principal and session cookie' })
  @ApiResponse({
    status: 201,
    description: 'Guest session token for the caller to store.',
  })
  public async createGuest(@Res({ passthrough: true }) response: Response) {
    const created = await this.authService.createGuestSession();
    response.setHeader(
      'Set-Cookie',
      buildSessionCookie(created.token, created.expiresAt),
    );
    response.status(201);

    return {
      token: created.token,
      expiresAt: created.expiresAt.toISOString(),
      principal: created.principal,
    };
  }
}
