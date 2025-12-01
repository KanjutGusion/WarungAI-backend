import { Request } from 'express';

export type ReqWithAuth = Request & {
  auth: {
    user: {
      id: string;
    };
    roles: Record<string, { name: string; permissions: string[] }>[];
    permissions: string[];
  };
  schoolId: string;
};

export type ReqWithSchool = Request & {
  schoolId: string;
};

export enum EUserRole {
  SUPER_ADMIN = 'Super Admin',
  SELLER = 'Seller',
}

declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        // destination?: string;
        // filename?: string;
        // path?: string;
        // buffer?: Buffer;
      }
    }
  }
}
