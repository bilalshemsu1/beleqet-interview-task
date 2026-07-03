import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateFreelanceJobDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  budgetMin: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  budgetMax: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pricingType?: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  deadlineDays: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationPreference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  experienceLevel?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
export class CreateBidDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  timelineDays: number;

  @ApiProperty()
  @IsString()
  coverLetter: string;
}

export class SubmitDeliverableDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateDisputeDto {
  @ApiProperty()
  @IsString()
  @MinLength(20, { message: 'Reason must be at least 20 characters' })
  reason: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidenceUrls?: string[];
}

@Injectable()
export class FreelanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createJob(clientId: string, dto: CreateFreelanceJobDto) {
    return this.prisma.freelanceJob.create({
      data: { ...dto, clientId, status: 'OPEN' },
      include: { category: true, client: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  async findJobs(query: { q?: string; category?: string; page?: number; limit?: number }) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 20;
    const { q, category } = query;

    const where: Record<string, unknown> = { status: { in: ['OPEN', 'FUNDED'] } };
    if (category) where['category'] = { slug: category };
    if (q) where['OR'] = [
      { title:       { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];

    const [items, total] = await Promise.all([
      this.prisma.freelanceJob.findMany({
        where: where as never,
        include: { category: true, _count: { select: { bids: true } } },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prisma.freelanceJob.count({ where: where as never }),
    ]);

    return { items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async findJobById(id: string) {
    const job = await this.prisma.freelanceJob.findUnique({
      where: { id },
      include: {
        category: true,
        client: { select: { id: true, firstName: true, lastName: true } },
        bids: {
          include: { freelancer: { select: { id: true, firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!job) throw new NotFoundException('Gig not found');
    return job;
  }

  async submitBid(freelancerId: string, gigId: string, dto: CreateBidDto) {
    const gig = await this.prisma.freelanceJob.findFirst({
      where: { id: gigId, status: { in: ['OPEN', 'FUNDED'] } },
    });
    if (!gig) throw new NotFoundException('Gig not found or no longer accepting bids');

    const existing = await this.prisma.bid.findUnique({
      where: { freelanceJobId_freelancerId: { freelanceJobId: gigId, freelancerId } },
    });
    if (existing) throw new ConflictException('You have already submitted a bid');

    return this.prisma.bid.create({ data: { ...dto, freelanceJobId: gigId, freelancerId } });
  }

  async acceptBid(bidId: string, clientId: string) {
    const bid = await this.prisma.bid.findFirst({
      where: { id: bidId, freelanceJob: { clientId } },
    });
    if (!bid) throw new NotFoundException('Bid not found');

    const contract = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Accept chosen bid, reject others
      await tx.bid.update({ where: { id: bidId }, data: { status: 'ACCEPTED' } });
      await tx.bid.updateMany({
        where: { freelanceJobId: bid.freelanceJobId, id: { not: bidId } },
        data: { status: 'REJECTED' },
      });

      // Create contract
      const c = await tx.contract.create({
        data: { freelanceJobId: bid.freelanceJobId, clientId, freelancerId: bid.freelancerId, agreedAmount: bid.amount },
      });

      // Update gig status
      await tx.freelanceJob.update({
        where: { id: bid.freelanceJobId },
        data: { status: 'IN_PROGRESS' },
      });

      // Create a chat room for this contract
      await tx.chatRoom.create({
        data: {
          contractId: c.id,
          participants: { create: [{ userId: clientId }, { userId: bid.freelancerId }] },
        },
      });

      return c;
    });

    return contract;
  }

  async getMyBids(freelancerId: string) {
    return this.prisma.bid.findMany({
      where: { freelancerId },
      include: { freelanceJob: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContract(id: string) {
    const c = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        milestones: { include: { deliverables: true } },
        freelanceJob: true,
        client:     { select: { id: true, firstName: true, lastName: true } },
        freelancer: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!c) throw new NotFoundException('Contract not found');
    return c;
  }

  async findCategories() {
    return this.prisma.freelanceCategory.findMany({ orderBy: { label: 'asc' } });
  }

  async approveMilestone(milestoneId: string, clientId: string) {
    const m = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contract: { clientId } },
    });
    if (!m) throw new ForbiddenException('Not authorized or milestone not found');
    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });
  }

  async submitDeliverable(milestoneId: string, freelancerId: string, dto: SubmitDeliverableDto) {
    const m = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contract: { freelancerId } },
      include: { contract: true },
    });
    if (!m) throw new NotFoundException('Milestone not found or not authorized');
    if (m.status !== 'IN_PROGRESS' && m.status !== 'SUBMITTED' && m.status !== 'REVISION_REQUESTED') {
      throw new BadRequestException('Milestone is not in a submittable state');
    }

    const deliverable = await this.prisma.deliverable.create({
      data: { milestoneId, fileUrl: dto.fileUrl, notes: dto.notes },
    });

    await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'SUBMITTED' },
    });

    return deliverable;
  }

  async createDispute(contractId: string, userId: string, dto: CreateDisputeDto) {
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, OR: [{ clientId: userId }, { freelancerId: userId }] },
    });
    if (!contract) throw new NotFoundException('Contract not found or not authorized');

    const existing = await this.prisma.dispute.findUnique({ where: { contractId } });
    if (existing) throw new ConflictException('A dispute already exists for this contract');

    return this.prisma.dispute.create({
      data: { contractId, raisedById: userId, reason: dto.reason, evidenceUrls: dto.evidenceUrls ?? [] },
    });
  }
}
