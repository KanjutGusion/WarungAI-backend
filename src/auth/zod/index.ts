import { z } from 'zod';

export class UsersValidation {
  static LOGIN = z.object({
    email: z.email(),
    password: z.string().min(8),
  });

  static RESGISTER = z.object({
    email: z.email(),
    password: z.string().min(8),
    school_name: z.string().min(3).max(50),
  });

  static AUTH_WHATSAPP_AGENT = z.object({
    phone: z.string(),
  });
}

export type AuthRegisterPayload = z.infer<typeof UsersValidation.RESGISTER>;
export type AuthLoginPayload = z.infer<typeof UsersValidation.LOGIN>;
export type AuthWhatsAppAgentPayload = z.infer<
  typeof UsersValidation.AUTH_WHATSAPP_AGENT
>;
