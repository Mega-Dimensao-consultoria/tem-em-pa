import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as twoFaRecoveryTemplate } from './two-fa-recovery'
import { template as reviewNewTemplate } from './review-new'
import { template as reviewReplyTemplate } from './review-reply'
import { template as companyApprovedTemplate } from './company-approved'
import { template as companyRejectedTemplate } from './company-rejected'
import { template as companySuspendedTemplate } from './company-suspended'
import { template as companyRepublishedTemplate } from './company-republished'
import { template as companyDeletedTemplate } from './company-deleted'
import { template as claimApprovedTemplate } from './claim-approved'
import { template as claimRejectedTemplate } from './claim-rejected'
import { template as claimReceivedTemplate } from './claim-received'
import { template as removalRequestReceivedTemplate } from './removal-request-received'
import { template as companyRemovalApprovedTemplate } from './company-removal-approved'
import { template as companyRemovalRejectedTemplate } from './company-removal-rejected'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'two-fa-recovery': twoFaRecoveryTemplate,
  'review-new': reviewNewTemplate,
  'review-reply': reviewReplyTemplate,
  'company-approved': companyApprovedTemplate,
  'company-rejected': companyRejectedTemplate,
  'company-suspended': companySuspendedTemplate,
  'company-republished': companyRepublishedTemplate,
  'company-deleted': companyDeletedTemplate,
  'claim-approved': claimApprovedTemplate,
  'claim-rejected': claimRejectedTemplate,
  'claim-received': claimReceivedTemplate,
  'removal-request-received': removalRequestReceivedTemplate,
  'company-removal-approved': companyRemovalApprovedTemplate,
  'company-removal-rejected': companyRemovalRejectedTemplate,
}

/**
 * Maps a notification.type value (created by DB triggers) to a template name.
 * Used by the notification-email dispatcher hook.
 */
export const NOTIFICATION_TYPE_TO_TEMPLATE: Record<string, string> = {
  review_new: 'review-new',
  review_reply: 'review-reply',
  company_approved: 'company-approved',
  company_rejected: 'company-rejected',
  company_suspended: 'company-suspended',
  company_republished: 'company-republished',
  company_deleted: 'company-deleted',
  claim_approved: 'claim-approved',
  claim_rejected: 'claim-rejected',
  claim_received: 'claim-received',
  removal_request_received: 'removal-request-received',
  company_removal_approved: 'company-removal-approved',
  company_removal_rejected: 'company-removal-rejected',
}
