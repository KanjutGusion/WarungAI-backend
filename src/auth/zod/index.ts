import { z } from 'zod';

export class UsersValidation {
  static LOGIN = z.object({
    email: z.email(),
    password: z.string().min(8),
  });

  static RESGISTER = z.object({
    email: z.email(),
    password: z.string().min(8),
  });
}

export type AuthRegisterPayload = z.infer<typeof UsersValidation.RESGISTER>;
export type AuthLoginPayload = z.infer<typeof UsersValidation.LOGIN>;
