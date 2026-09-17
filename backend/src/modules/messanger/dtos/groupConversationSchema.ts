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
