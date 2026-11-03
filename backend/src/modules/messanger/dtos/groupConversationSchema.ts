/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
import { Joi } from 'celebrate';
export const groupConversationSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  emails: Joi.array()
    .items(
      Joi.string()
        .trim()
        .max(254)
        .email({ tlds: { allow: false } })
        .messages({
          'string.email':
            '{{#label}} ({{#value}}) must be a valid email address',
        })
        .required(),
    )
    .min(2)
    .max(49)
    .required(),
});
