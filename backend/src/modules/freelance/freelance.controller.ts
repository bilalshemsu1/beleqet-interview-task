// freelance.controller.ts
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { FreelanceService, CreateFreelanceJobDto, CreateBidDto, SubmitDeliverableDto, CreateDisputeDto } from './freelance.service';

@ApiTags('freelance')
@Controller('freelance')
export class FreelanceController {
  constructor(private readonly svc: FreelanceService) {}

  // ── Public endpoints ──────────────────────────────────────────────────────

  @Get('categories')
  findCategories() { return this.svc.findCategories(); }

  @Get('jobs')
  findJobs(@Query() q: { q?: string; category?: string; page?: number; limit?: number }) { return this.svc.findJobs(q); }

  @Get('jobs/:id')
  findJob(@Param('id') id: string) { return this.svc.findJobById(id); }

  // ── Employer: post gigs ──────────────────────────────────────────────────

  @Post('jobs')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('EMPLOYER', 'ADMIN') @ApiBearerAuth()
  createJob(@CurrentUser() u: CurrentUserPayload, @Body() dto: CreateFreelanceJobDto) { return this.svc.createJob(u.userId, dto); }

  // ── Freelancer: bid on gigs ──────────────────────────────────────────────

  @Post('jobs/:id/bids')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('FREELANCER') @ApiBearerAuth()
  submitBid(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload, @Body() dto: CreateBidDto) { return this.svc.submitBid(u.userId, id, dto); }

  // ── Employer: accept a bid ──────────────────────────────────────────────

  @Patch('bids/:id/accept')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('EMPLOYER', 'ADMIN') @ApiBearerAuth()
  acceptBid(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.svc.acceptBid(id, u.userId); }

  // ── Authenticated: view own bids / contracts ─────────────────────────────

  @Get('my-bids')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  myBids(@CurrentUser() u: CurrentUserPayload) { return this.svc.getMyBids(u.userId); }

  @Get('contracts/:id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  contract(@Param('id') id: string) { return this.svc.getContract(id); }

  // ── Employer: approve milestone ──────────────────────────────────────────

  @Patch('milestones/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('EMPLOYER', 'ADMIN') @ApiBearerAuth()
  approveMilestone(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.svc.approveMilestone(id, u.userId); }

  // ── Freelancer: submit deliverable ───────────────────────────────────────

  @Post('milestones/:id/deliverables')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('FREELANCER') @ApiBearerAuth()
  submitDeliverable(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload, @Body() dto: SubmitDeliverableDto) { return this.svc.submitDeliverable(id, u.userId, dto); }

  // ── Either party: raise dispute ──────────────────────────────────────────

  @Post('contracts/:id/disputes')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('EMPLOYER', 'FREELANCER') @ApiBearerAuth()
  createDispute(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload, @Body() dto: CreateDisputeDto) { return this.svc.createDispute(id, u.userId, dto); }
}
