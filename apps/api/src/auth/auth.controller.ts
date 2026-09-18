import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  RequestMagicLinkSchema,
  VerifyMagicLinkSchema,
  type RequestMagicLinkInput,
  type VerifyMagicLinkInput,
} from '@compy/shared';
import type { Response } from 'express';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import { AuthService } from './auth.service.js';
import { CurrentPrincipal } from './current-principal.decorator.js';
import { buildSessionCookie, SessionAuthGuard } from './session-auth.guard.js';
import type { Principal } from './session.constants.js';

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

  @Get('me')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Return the current session principal' })
  public async me(@CurrentPrincipal() principal: Principal) {
    return this.authService.getPrincipalProfile(principal);
  }

  @Delete('me')
  @UseGuards(SessionAuthGuard)
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Delete the current account and return a fresh guest session cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'Account deleted; new guest session issued.',
  })
  public async deleteMe(
    @CurrentPrincipal() principal: Principal,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.deleteAccount(principal.id);
    const created = await this.authService.createGuestSession();

    response.setHeader(
      'Set-Cookie',
      buildSessionCookie(created.token, created.expiresAt),
    );

    return {
      token: created.token,
      expiresAt: created.expiresAt.toISOString(),
      principal: created.principal,
    };
  }

  @Post('magic-link')
  @ApiOperation({ summary: 'Email a passwordless sign-in link' })
  public async requestMagicLink(
    @Body(new ZodValidationPipe(RequestMagicLinkSchema))
    body: RequestMagicLinkInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.status(200);
    return this.authService.requestMagicLink(body.email);
  }

  @Post('magic-link/verify')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Verify a magic link and claim guest data' })
  public async verifyMagicLink(
    @Body(new ZodValidationPipe(VerifyMagicLinkSchema))
    body: VerifyMagicLinkInput,
    @CurrentPrincipal() principal: Principal,
    @Res({ passthrough: true }) response: Response,
  ) {
    const guestUserId = principal.kind === 'guest' ? principal.id : null;
    const session = await this.authService.verifyMagicLink(
      body.token,
      guestUserId,
    );

    response.setHeader(
      'Set-Cookie',
      buildSessionCookie(session.token, session.expiresAt),
    );
    response.status(200);

    return {
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      principal: session.principal,
    };
  }

  @Get('google/start')
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'Build a Google OAuth redirect URL for this session' })
  public async startGoogle(@CurrentPrincipal() principal: Principal) {
    return this.authService.startGoogleOAuth(principal.id);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback; redirects to the web app' })
  public async googleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Res() response: Response,
  ) {
    const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:3001';

    if (
      code === undefined ||
      code.length === 0 ||
      state === undefined ||
      state.length === 0
    ) {
      response.redirect(`${webOrigin}/auth/error?reason=missing_params`);
      return;
    }

    try {
      const session = await this.authService.completeGoogleOAuth(code, state);
      const params = new URLSearchParams({
        token: session.token,
        expiresAt: session.expiresAt.toISOString(),
      });
      response.redirect(`${webOrigin}/auth/session?${params.toString()}`);
    } catch {
      response.redirect(`${webOrigin}/auth/error?reason=oauth_failed`);
    }
  }
}
