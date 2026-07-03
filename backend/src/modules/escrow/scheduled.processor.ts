import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job as BullJob } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import {
  QUEUE_NAMES,
  NOTIFICATION_JOBS,
} from '../queues/queues.constants';

const SCHEDULED_JOBS = {
  AUTO_APPROVE_MILESTONES: 'auto-approve-milestones',
  RELEASE_PENDING_WALLET: 'release-pending-wallet',
} as const;

const MILESTONE_AUTO_APPROVE_DAYS = 14;

@Injectable()
@Processor(QUEUE_NAMES.SCHEDULED)
export class ScheduledProcessor {
  private readonly logger = new Logger(ScheduledProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
    private readonly notificationsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ESCROW)
    private readonly escrowQueue: Queue,
  ) {}

  // ── 1. Auto-approve milestones submitted > 14 days ago ──────────────────

  @Process(SCHEDULED_JOBS.AUTO_APPROVE_MILESTONES)
  async handleAutoApproveMilestones() {
    this.logger.log('[scheduled] Checking for milestones to auto-approve');

    const cutoff = new Date(Date.now() - MILESTONE_AUTO_APPROVE_DAYS * 24 * 60 * 60 * 1000);

    const staleMilestones = await this.prisma.milestone.findMany({
      where: {
        status: 'SUBMITTED',
        submittedAt: { not: null, lt: cutoff },
      },
      include: {
        contract: {
          include: {
            client: { select: { id: true, firstName: true, lastName: true } },
            freelancer: { select: { id: true, firstName: true, lastName: true } },
            freelanceJob: { include: { escrowTx: true } },
          },
        },
      },
    });

    this.logger.log(`[scheduled] Found ${staleMilestones.length} milestones to auto-approve`);

    for (const milestone of staleMilestones) {
      try {
        // Approve the milestone
        await this.prisma.milestone.update({
          where: { id: milestone.id },
          data: { status: 'APPROVED', approvedAt: new Date() },
        });

        // Trigger escrow release (3-day hold)
        const escrow = milestone.contract.freelanceJob.escrowTx;
        if (escrow && escrow.status === 'FUNDED') {
          await this.escrowQueue.add('auto-release-milestone', {
            milestoneId: milestone.id,
            freelancerId: milestone.contract.freelancerId,
            amount: milestone.amount,
            releaseAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        // Notify client
        await this.notificationsQueue.add(NOTIFICATION_JOBS.SEND_IN_APP, {
          userId: milestone.contract.clientId,
          type: 'milestone.auto_approved',
          title: 'Milestone auto-approved',
          body: `Milestone "${milestone.title}" was auto-approved after ${MILESTONE_AUTO_APPROVE_DAYS} days without client action.`,
          metadata: { milestoneId: milestone.id, contractId: milestone.contractId },
        });

        // Notify freelancer
        await this.notificationsQueue.add(NOTIFICATION_JOBS.SEND_IN_APP, {
          userId: milestone.contract.freelancerId,
          type: 'milestone.approved',
          title: `Milestone "${milestone.title}" approved`,
          body: 'Your milestone was auto-approved. Funds will be available after a 3-day hold.',
          metadata: { milestoneId: milestone.id, amount: milestone.amount },
        });

        this.logger.log(`[scheduled] Auto-approved milestone ${milestone.id}`);
      } catch (err) {
        this.logger.error(`[scheduled] Failed to auto-approve milestone ${milestone.id}`, err instanceof Error ? err.stack : err);
      }
    }
  }

  // ── 2. Release pending wallet balances after hold period ─────────────────

  @Process(SCHEDULED_JOBS.RELEASE_PENDING_WALLET)
  async handleReleasePendingWallet() {
    this.logger.log('[scheduled] Checking for pending wallet releases');

    // This is handled by the escrow processor's auto-release-milestone job
    // with BullMQ's delay mechanism, so this job is a no-op placeholder
    // for any future scheduled wallet operations
  }

  // ── Error Handler ────────────────────────────────────────────────────────

  @OnQueueFailed()
  onFailed(job: BullJob, error: Error) {
    this.logger.error(
      `[scheduled-queue] Job failed: [${job.name}] id=${job.id} attempt=${job.attemptsMade}`,
      error.stack,
    );
  }
}
