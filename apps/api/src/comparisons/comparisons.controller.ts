import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';
import {
  CreateAccessRequestSchema,
  CreateComparisonSchema,
  InviteByEmailSchema,
  PublicIdSchema,
  UpdateComparisonSchema,
  IdSchema,
} from '@compy/shared';
import type {
  CreateAccessRequestInput,
  CreateComparisonInput,
  InviteByEmailInput,
  UpdateComparisonInput,
} from '@compy/shared';
import { CurrentPrincipal } from '../auth/current-principal.decorator.js';
import type { Principal } from '../auth/session.constants.js';
import { SessionAuthGuard } from '../auth/session-auth.guard.js';
import { ComparisonsService } from './comparisons.service.js';
import { SharingService } from './sharing.service.js';

@Controller('comparisons')
@ApiTags('comparisons')
@UseGuards(SessionAuthGuard)
export class ComparisonsController {
  constructor(
    private readonly comparisonsService: ComparisonsService,
    private readonly sharingService: SharingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List comparisons accessible to the caller' })
  @ApiResponse({
    status: 200,
    description: 'Owned or granted comparisons ordered by most recently updated.',
  })
  public getComparisons(@CurrentPrincipal() principal: Principal) {
    return this.comparisonsService.getAll(principal.id);
  }

  @Get(':publicId/access')
  @ApiOperation({
    summary: 'Check whether the caller can open a comparison',
  })
  @ApiResponse({
    status: 200,
    description: 'Accessible (owner/editor) or locked without payload.',
  })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public getComparisonAccess(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.sharingService.getAccessStatus(publicId, principal.id);
  }

  @Get(':publicId/access-requests')
  @ApiOperation({ summary: 'List pending access requests (owner only)' })
  @ApiResponse({ status: 200, description: 'Pending access requests.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public listAccessRequests(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.sharingService.listAccessRequests(publicId, principal.id);
  }

  @Post(':publicId/access-requests')
  @ApiOperation({ summary: 'Apply for access to a locked comparison' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['displayName'],
      properties: {
        displayName: { type: 'string', minLength: 1, maxLength: 200 },
        message: { type: 'string', maxLength: 1000 },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Access request created.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public createAccessRequest(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Body(new ZodValidationPipe(CreateAccessRequestSchema))
    body: CreateAccessRequestInput,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.sharingService.createAccessRequest(
      publicId,
      principal.id,
      body,
    );
  }

  @Post(':publicId/access-requests/:requestId/accept')
  @ApiOperation({ summary: 'Accept an access request (owner only)' })
  @ApiResponse({ status: 200, description: 'Request accepted; grant created.' })
  @ApiResponse({ status: 404, description: 'Comparison or request not found.' })
  public acceptAccessRequest(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Param('requestId', new ZodValidationPipe(IdSchema)) requestId: number,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.sharingService.acceptAccessRequest(
      publicId,
      principal.id,
      requestId,
    );
  }

  @Post(':publicId/access-requests/:requestId/reject')
  @ApiOperation({ summary: 'Reject an access request (owner only)' })
  @ApiResponse({ status: 200, description: 'Request rejected.' })
  @ApiResponse({ status: 404, description: 'Comparison or request not found.' })
  public rejectAccessRequest(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Param('requestId', new ZodValidationPipe(IdSchema)) requestId: number,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.sharingService.rejectAccessRequest(
      publicId,
      principal.id,
      requestId,
    );
  }

  @Post(':publicId/invites')
  @ApiOperation({
    summary: 'Invite a registered user by email (owner only)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Editor grant created or existing.' })
  @ApiResponse({ status: 400, description: 'Unknown email or invalid invite.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public inviteByEmail(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Body(new ZodValidationPipe(InviteByEmailSchema)) body: InviteByEmailInput,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.sharingService.inviteByEmail(publicId, principal.id, body);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Get a comparison with criteria and entries' })
  @ApiResponse({ status: 200, description: 'The requested comparison.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public getComparisonByPublicId(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.comparisonsService.getByPublicId(publicId, principal.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a comparison' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
          example: 'Lisbon hotels',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The comparison and its built-in name criterion.',
  })
  public createComparison(
    @Body(new ZodValidationPipe(CreateComparisonSchema))
    body: CreateComparisonInput,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.comparisonsService.createComparison(body, principal.id);
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Rename a comparison' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 200,
          example: 'Phones 2026',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'The renamed comparison.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public updateComparison(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @Body(new ZodValidationPipe(UpdateComparisonSchema))
    body: UpdateComparisonInput,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.comparisonsService.update(publicId, principal.id, body);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Delete a comparison and its related data' })
  @ApiResponse({ status: 200, description: 'The deleted comparison.' })
  @ApiResponse({ status: 404, description: 'Comparison not found.' })
  public deleteComparison(
    @Param('publicId', new ZodValidationPipe(PublicIdSchema)) publicId: string,
    @CurrentPrincipal() principal: Principal,
  ) {
    return this.comparisonsService.remove(publicId, principal.id);
  }
}
