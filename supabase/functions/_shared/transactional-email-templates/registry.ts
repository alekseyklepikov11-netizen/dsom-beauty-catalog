/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as newsletterConfirmation } from './newsletter-confirmation.tsx'
import { template as supportEscalation } from './support-escalation.tsx'
import { template as promoWelcome } from './promo-welcome.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'newsletter-confirmation': newsletterConfirmation,
  'support-escalation': supportEscalation,
  'promo-welcome': promoWelcome,
  'promo_welcome': promoWelcome, // alias под snake_case из PromoGate
}
