import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { Principal } from './session.constants.js';

export type RequestWithPrincipal = Request & {
  principal?: Principal;
};

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Principal => {
    const request = ctx.switchToHttp().getRequest<RequestWithPrincipal>();
    const principal = request.principal;

    if (principal === undefined) {
      throw new Error('CurrentPrincipal used without SessionAuthGuard');
    }

    return principal;
  },
);
