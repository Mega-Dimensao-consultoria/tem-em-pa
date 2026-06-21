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
import { template as claimApprovedTemplate } from './claim-approved'
import { template as claimRejectedTemplate } from './claim-rejected'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'two-fa-recovery': twoFaRecoveryTemplate,
  'review-new': reviewNewTemplate,
  'review-reply': reviewReplyTemplate,
  'company-approved': companyApprovedTemplate,
  'company-rejected': companyRejectedTemplate,
  'claim-approved': claimApprovedTemplate,
  'claim-rejected': claimRejectedTemplate,
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
  claim_approved: 'claim-approved',
  claim_rejected: 'claim-rejected',
}
