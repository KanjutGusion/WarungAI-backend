import { Request } from 'express';
import { EUserStatus } from 'src/generated/prisma/enums';

export type ReqWithAuth = Request & {
  user: {
    id: string;
    role: {
      id: string;
      name: string;
    };
  };
};

export type JwtPayload = {
  user: {
    id: string;
    username: string;
    phone: string;
    email: string;
    status: EUserStatus;
    role: { id: string; name: EUserRole };
  };
};

export enum EUserRole {
  SUPER_ADMIN = 'Super Admin',
  SELLER = 'Seller',
}

// declare global {
//   namespace Express {
//     namespace Multer {
//       interface File {
//         fieldname: string;
//         originalname: string;
//         encoding: string;
//         mimetype: string;
//         size: number;
//         destination?: string;
//         filename?: string;
//         path?: string;
//         buffer?: Buffer;
//       }
//     }
//   }
// }
