import { SetMetadata } from '@nestjs/common';

export const REQ_PERMS = 'reqPerms';
export const Permissions = (...codes: string[]) => SetMetadata(REQ_PERMS, codes);
