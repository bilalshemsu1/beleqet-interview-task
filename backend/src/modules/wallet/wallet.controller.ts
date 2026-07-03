// wallet.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { WalletService, WithdrawDto } from './wallet.service';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard) @Roles('FREELANCER')
@Controller('wallet')
export class WalletController {
  constructor(private readonly svc: WalletService) {}

  @Get()
  getWallet(@CurrentUser() u: CurrentUserPayload) { return this.svc.getOrCreate(u.userId); }

  @Post('withdraw')
  withdraw(@CurrentUser() u: CurrentUserPayload, @Body() dto: WithdrawDto) { return this.svc.withdraw(u.userId, dto); }
}
