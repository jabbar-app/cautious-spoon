import { Injectable, ForbiddenException, UnauthorizedException, ConflictException,NotFoundException, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { MailerService } from '../../core/mailer/mailer.service';
import { randomUUID } from 'node:crypto';
import { LoggerService } from '../../core/logger/logger.service';
import { ResendVerifyDto } from './dto/resend-verify.dto';
import { safeBcryptCompare } from '../../common/utils/crypto';

import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { buildVerifyUrl as buildUrlWithToken } from '../../common/utils/url'; // reuse helper; it just appends ?token=...
import { rounds, findMatchingRefresh, buildVerifyUrl, setCookie, randomHex, parseTtlMs, hash, throttle, findMatchingRefreshEmployer, findMatchingRefreshCandidate } from './auth.helpers';

const RESEND_COOLDOWN_MS = 60_000;
const lastSendAt = new Map<string, number>();
type UserType = 'admin' | 'superadmin' | 'employer' | 'candidate';



@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private mailer: MailerService,
    private logger: LoggerService,
  ) {}

  // ===== Helpers =====
  private async signAccess(sub: string, typ: UserType) {
    return this.jwt.signAsync(
      { sub, typ },
      { secret: process.env.JWT_ACCESS_SECRET!, expiresIn: process.env.JWT_ACCESS_TTL ?? '15m' },
    );
  }

  private async signRefreshJwt(sub: string, typ: Exclude<UserType, 'admin'>) {
    const refreshPlain = await this.jwt.signAsync(
      { sub, typ },
      { secret: process.env.JWT_REFRESH_SECRET!, expiresIn: process.env.JWT_REFRESH_TTL ?? '30d' },
    );
    const expires_at = new Date(Date.now() + parseTtlMs(process.env.JWT_REFRESH_TTL ?? '30d'));
    return { refreshPlain, expires_at };
  }

  private async buildAdminProfile(adminId: string) {
    const a = await this.prisma.admins.findUnique({ where: { id: adminId } });
    if (!a) return null;

    const { roleTitles, permTitles } = await this.resolveAdminRoleTitlesAndPermissions(adminId);

    // If you still need the stitched shape, attach it:
    const stitched = { ...a, admin_roles: roleTitles.map((title) => ({ roles: { title } })) };

    // Or, if you only need arrays of strings:
    const roles = roleTitles;
    const permissions = permTitles;

    return {
      id: a?.id!,
      email: a?.email ?? '',
      name: a?.name ?? '',
      phone: a?.phone ?? '',
      last_login: a?.last_login ?? null,
      created_at: a?.created_at ?? null,
      roles,
      permissions: Array.from(permissions),
    };
  }

  private signReset(payload: { email: string; typ: 'admin' | 'employer' | 'candidate' }) {
    return this.jwt.signAsync(
      { ...payload, purpose: 'reset' },
      { secret: process.env.JWT_RESET_SECRET || process.env.JWT_REFRESH_SECRET!, expiresIn: '1h' },
    );
  }

  private verifyReset(token: string) {
    return this.jwt.verifyAsync<{ email: string; typ: string; purpose: string }>(
      token,
      { secret: process.env.JWT_RESET_SECRET || process.env.JWT_REFRESH_SECRET! },
    );
  }

  private async resolveAdminRoleTitlesAndPermissions(adminId: string) {
    // admin_roles -> roles
    const adminRoles = await this.prisma.admin_roles.findMany({
      where: { id_admin: adminId },
    });
    const roleIds = adminRoles.map((ar) => ar.id_role);
    const roles = roleIds.length
      ? await this.prisma.roles.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, title: true },
        })
      : [];

    // role_permissions -> permissions
    const rolePerms = roleIds.length
      ? await this.prisma.role_permissions.findMany({
          where: { id_role: { in: roleIds } },
        })
      : [];
    const permIds = Array.from(new Set(rolePerms.map((rp) => rp.id_permission).filter((v): v is bigint => v !== null && v !== undefined)));
    const perms = permIds.length
      ? await this.prisma.permissions.findMany({
          where: { id: { in: permIds } },
          select: { id: true, title: true },
        })
      : [];

    const roleTitles = roles.map((r) => r.title ?? '').filter(Boolean);
    const permTitles = Array.from(new Set(perms.map((p) => p.title ?? '').filter(Boolean)));

    return { roleTitles, permTitles };
  }

  // private readonly SA_TITLES = (process.env.SUPERADMIN_ROLE_TITLES || 'system_admin').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

  // ===== Admin (DB-backed rotating refresh) =====
  async loginAdmin(email: string, password: string, ctx: { ip: string; ua: string; res: any }) {

    const admin = await this.prisma.admins.findFirst({
      where: { email, deleted_at: null },
    });

    // Do not reveal which factor failed
    if (!admin || !admin.password) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // Safe bcrypt compare
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const accessToken = await this.signAccess(admin.id, 'admin');

    // refresh token cookie
    const refreshPlain = randomHex(64);
    const token_hash = await bcrypt.hash(refreshPlain, rounds());
    const now = new Date();
    const expires_at = new Date(now.getTime() + parseTtlMs(process.env.JWT_REFRESH_TTL ?? '30d'));

    await this.prisma.admin_refresh_tokens.create({
      data: {
        admin_id: admin.id,
        token_hash,
        issued_at: now,
        expires_at,
        ip: ctx.ip,
        user_agent: ctx.ua,
      },
    });

    setCookie(ctx.res, 'refresh_token', refreshPlain, expires_at);

    const profile = await this.buildAdminProfile(admin.id);
    return { accessToken, user: profile };
  }

  async refreshAdmin(oldToken: string, ctx: { ip: string; ua: string; res: any }) {
    if (!oldToken) throw new ForbiddenException('MISSING_REFRESH');

    const tokens = await this.prisma.admin_refresh_tokens.findMany({
      where: { revoked_at: null },
      orderBy: { issued_at: 'desc' },
    });

    const match = await findMatchingRefresh(oldToken, tokens);
    if (!match) throw new ForbiddenException('INVALID_REFRESH');

    if (match.expires_at.getTime() < Date.now()) {
      await this.prisma.admin_refresh_tokens.update({ where: { id: match.id }, data: { revoked_at: new Date() } });
      throw new ForbiddenException('REFRESH_EXPIRED');
    }

    // rotate
    await this.prisma.admin_refresh_tokens.update({ where: { id: match.id }, data: { revoked_at: new Date() } });

    const refreshPlain = randomHex(64);
    const token_hash = await bcrypt.hash(refreshPlain, rounds());
    const expires_at = new Date(Date.now() + parseTtlMs(process.env.JWT_REFRESH_TTL ?? '30d'));

    await this.prisma.admin_refresh_tokens.create({
      data: {
        admin_id: match.admin_id,
        token_hash,
        issued_at: new Date(),
        expires_at,
        ip: ctx.ip,
        user_agent: ctx.ua,
      },
    });

    const accessToken = await this.signAccess(match.admin_id, 'admin');
    setCookie(ctx.res, 'refresh_token', refreshPlain, expires_at);
    const profile = await this.buildAdminProfile(match.admin_id);
    return { accessToken, user: profile };
  }

  async logoutAdmin(oldToken: string) {
    if (!oldToken) return;
    const tokens = await this.prisma.admin_refresh_tokens.findMany({ where: { revoked_at: null } });
    const match = await findMatchingRefresh(oldToken, tokens);
    if (match) {
      await this.prisma.admin_refresh_tokens.update({ where: { id: match.id }, data: { revoked_at: new Date() } });
    }
  }

  // ===== Registrations =====
  async registerCandidate(dto: RegisterCandidateDto, _ctx: { res: any }) {
    const exists = await this.prisma.candidates.findFirst({
      where: { email: dto.email, deleted_at: null },
    });
    if (exists) throw new ConflictException('EMAIL_TAKEN');

    const id = randomUUID();
    const password = await bcrypt.hash(dto.password, Number(process.env.BCRYPT_ROUNDS || 10));

    const c = await this.prisma.candidates.create({
      data: {
        id,
        email: dto.email,
        password,
        name: dto.name ?? '',
        phone: dto.phone ?? '',
        onboarding: false,
        created_at: new Date(),
        email_verified: false,
      },
    });

    let verification_sent = true;
    try {
      const verifyToken = await this.jwt.signAsync(
        { sub: c.id, typ: 'candidate', purpose: 'verify' },
        {
          secret: process.env.JWT_EMAIL_VERIFY_SECRET || process.env.JWT_ACCESS_SECRET!,
          expiresIn: '3d',
        },
      );
      const verifyUrl = buildVerifyUrl(dto.url, verifyToken);

      await this.mailer.sendVerifyCandidate({
        template: 'core/mailer/candidate/email_verification.html',
        to: c.email,
        url: verifyUrl,
        subject: 'Verifikasi Email Kamu',
        year: new Date().getFullYear().toString(),
      });

      lastSendAt.set(`candidate:${c.email}`, Date.now());
    } catch (err: any) {
      verification_sent = false;
      this.logger.error(`[MAIL] candidate register send failed`, err?.stack || String(err));
    }

    return {
      verification_sent,
      user: {
        id: c.id,
        email: c.email,
        name: c.name ?? '',
        phone: c.phone ?? '',
        email_verified: false,
        created_at: c.created_at ?? null,
      },
    };
  }

  async registerEmployer(dto: RegisterEmployerDto, _ctx: { res: any }) {
    const exists = await this.prisma.employers.findFirst({
      where: { email: dto.email, deleted_at: null },
    });
    if (exists) throw new ConflictException('EMAIL_TAKEN');

    const id = randomUUID();
    const password = await bcrypt.hash(dto.password, Number(process.env.BCRYPT_ROUNDS || 10));

    const e = await this.prisma.employers.create({
      data: {
        id,
        email: dto.email,
        password,
        name: dto.name ?? '',
        phone: dto.phone ?? '',
        onboarding: false,
        created_at: new Date(),
        email_verified: false,
        is_active: true,
      },
    });

    let verification_sent = true;
    try {
      const verifyToken = await this.jwt.signAsync(
        { sub: e.id, typ: 'employer', purpose: 'verify' },
        {
          secret: process.env.JWT_EMAIL_VERIFY_SECRET || process.env.JWT_ACCESS_SECRET!,
          expiresIn: '3d',
        },
      );
      const verifyUrl = buildVerifyUrl(dto.url, verifyToken);

      await this.mailer.sendVerifyEmployer({
        template: 'core/mailer/employer/email_verification.html',
        to: e.email,
        url: verifyUrl,
        subject: 'Verifikasi Email Perusahaan',
        year: new Date().getFullYear().toString(),
      });

      lastSendAt.set(`employer:${e.email}`, Date.now());
    } catch (err: any) {
      verification_sent = false;
      this.logger.error(`[MAIL] employer register send failed`, err?.stack || String(err));
    }

    return {
      verification_sent,
      user: {
        id: e.id,
        email: e.email,
        name: e.name ?? '',
        phone: e.phone ?? '',
        email_verified: false,
        created_at: e.created_at ?? null,
      },
    };
  }

  async resendCandidateVerify(dto: ResendVerifyDto) {
    // soft anti-spam
    const key = `candidate:${dto.email}`;
    const last = lastSendAt.get(key) || 0;
    if (Date.now() - last < RESEND_COOLDOWN_MS) {
      return { verification_sent: true, throttled: true }; // hide enumeration
    }

    const c = await this.prisma.candidates.findFirst({
      where: { email: dto.email, deleted_at: null },
    });

    // Always return success to avoid account enumeration
    if (!c || c.email_verified) {
      return { verification_sent: true };
    }

    try {
      const token = await this.jwt.signAsync(
        { sub: c.id, typ: 'candidate', purpose: 'verify' },
        {
          secret: process.env.JWT_EMAIL_VERIFY_SECRET || process.env.JWT_ACCESS_SECRET!,
          expiresIn: '3d',
        },
      );
      const verifyUrl = buildVerifyUrl(dto.url, token);

      await this.mailer.sendVerifyCandidate({
        template: 'core/mailer/candidate/email_verification.html',
        to: c.email,
        url: verifyUrl,
        subject: 'Verifikasi Email Kamu',
        year: new Date().getFullYear().toString(),
      });

      lastSendAt.set(key, Date.now());
    } catch (err: any) {
      this.logger.error(`[MAIL] candidate resend failed`, err?.stack || String(err));
      // Do not leak error details to client
    }

    return { verification_sent: true };
  }

  async resendEmployerVerify(dto: ResendVerifyDto) {
    const key = `employer:${dto.email}`;
    const last = lastSendAt.get(key) || 0;
    if (Date.now() - last < RESEND_COOLDOWN_MS) {
      return { verification_sent: true, throttled: true };
    }

    const e = await this.prisma.employers.findFirst({
      where: { email: dto.email, deleted_at: null },
    });

    if (!e || e.email_verified) {
      return { verification_sent: true };
    }

    try {
      const token = await this.jwt.signAsync(
        { sub: e.id, typ: 'employer', purpose: 'verify' },
        {
          secret: process.env.JWT_EMAIL_VERIFY_SECRET || process.env.JWT_ACCESS_SECRET!,
          expiresIn: '3d',
        },
      );
      const verifyUrl = buildVerifyUrl(dto.url, token);

      await this.mailer.sendVerifyEmployer({
        template: 'core/mailer/employer/email_verification.html',
        to: e.email,
        url: verifyUrl,
        subject: 'Verify your email',
        year: new Date().getFullYear().toString(),
      });

      lastSendAt.set(key, Date.now());
    } catch (err: any) {
      this.logger.error(`[MAIL] employer resend failed`, err?.stack || String(err));
    }

    return { verification_sent: true };
  }

  // async loginSuperadmin(email: string, password: string, ctx: { res: any }) {
  //   const e = await this.prisma.superadmins.findFirst({ where: { email } });
  //   if (!e) throw new UnauthorizedException('INVALID_CREDENTIALS');
  //   const ok = await bcrypt.compare(password, e.password);
  //   if (!ok) throw new UnauthorizedException('INVALID_CREDENTIALS');

  //   const accessToken = await this.signAccess(e.id, 'superadmin');
  //   const { refreshPlain, expires_at } = await this.signRefreshJwt(e.id, 'superadmin');

  //   console.log(refreshPlain)
  //   setCookie(ctx.res, 'superadmin_refresh_token', refreshPlain, expires_at);

  //   return { accessToken, user: { id: e.id, email: e.email } };
  // }

  async loginSuperadmin(email: string, password: string, ctx: { ip: string; ua: string; res: any }) {
    const admin = await this.prisma.superadmins.findFirst({
      where: { email },
    });

    // Do not reveal which factor failed
    if (!admin || !admin.password) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // Safe bcrypt compare
    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const accessToken = await this.signAccess(admin.id, 'superadmin');

    // refresh token cookie
    const refreshPlain = randomHex(64);
    const token_hash = await bcrypt.hash(refreshPlain, rounds());
    const now = new Date();
    const expires_at = new Date(now.getTime() + parseTtlMs(process.env.JWT_REFRESH_TTL ?? '30d'));

    await this.prisma.superadmin_refresh_tokens.create({
      data: {
        admin_id: admin.id,
        token_hash,
        issued_at: now,
        expires_at,
        ip: ctx.ip,
        user_agent: ctx.ua,
      },
    });

    setCookie(ctx.res, 'refresh_token', refreshPlain, expires_at);

    const profile = await this.buildAdminProfile(admin.id);
    return { accessToken, user: profile };
  }

  async refreshSuperadmin(oldToken: string, ctx: { ip: string; ua: string; res: any }) {
    if (!oldToken) throw new ForbiddenException('MISSING_REFRESH');

    const tokens = await this.prisma.superadmin_refresh_tokens.findMany({
      where: { revoked_at: null },
      orderBy: { issued_at: 'desc' },
    });

    const match = await findMatchingRefresh(oldToken, tokens);
    if (!match) throw new ForbiddenException('INVALID_REFRESH');

    if (match.expires_at.getTime() < Date.now()) {
      await this.prisma.superadmin_refresh_tokens.update({ where: { id: match.id }, data: { revoked_at: new Date() } });
      throw new ForbiddenException('REFRESH_EXPIRED');
    }

    // rotate
    await this.prisma.superadmin_refresh_tokens.update({ where: { id: match.id }, data: { revoked_at: new Date() } });

    const refreshPlain = randomHex(64);
    const token_hash = await bcrypt.hash(refreshPlain, rounds());
    const expires_at = new Date(Date.now() + parseTtlMs(process.env.JWT_REFRESH_TTL ?? '30d'));

    await this.prisma.superadmin_refresh_tokens.create({
      data: {
        admin_id: match.admin_id,
        token_hash,
        issued_at: new Date(),
        expires_at,
        ip: ctx.ip,
        user_agent: ctx.ua,
      },
    });

    const accessToken = await this.signAccess(match.admin_id, 'superadmin');
    setCookie(ctx.res, 'refresh_token', refreshPlain, expires_at);
    const profile = await this.buildAdminProfile(match.admin_id);
    return { accessToken, user: profile };
  }

  // async loginEmployer(email: string, password: string, ctx: { res: any }) {
  //   const e = await this.prisma.employers.findFirst({ where: { email, deleted_at: null } });
  //   if (!e) throw new UnauthorizedException('INVALID_CREDENTIALS');
  //   const ok = await bcrypt.compare(password, e.password);
  //   if (!ok) throw new UnauthorizedException('INVALID_CREDENTIALS');
  //   if (!e.email_verified) throw new ForbiddenException('EMAIL_NOT_VERIFIED');

  //   const accessToken = await this.signAccess(e.id, 'employer');
  //   const { refreshPlain, expires_at } = await this.signRefreshJwt(e.id, 'employer');
  //   setCookie(ctx.res, 'employer_refresh_token', refreshPlain, expires_at);

  //   return { accessToken, user: { id: e.id, email: e.email, name: e.name ?? '', phone: e.phone ?? '', last_login: e.last_login ?? null, created_at: e.created_at ?? null } };
  // }

  async loginEmployer(email: string, password: string, ctx: { ip: string; ua: string; res: any }) {

    const employer = await this.prisma.employers.findFirst({
      where: { email, deleted_at:null },
    });

    // Do not reveal which factor failed
    if (!employer || !employer.password) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // Safe bcrypt compare
    const ok = await bcrypt.compare(password, employer.password);
    if (!ok) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const accessToken = await this.signAccess(employer.id, 'employer');

    // refresh token cookie
    const refreshPlain = randomHex(64);
    const token_hash = await bcrypt.hash(refreshPlain, rounds());
    const now = new Date();
    const expires_at = new Date(now.getTime() + parseTtlMs(process.env.JWT_REFRESH_TTL ?? '30d'));

    await this.prisma.employer_refresh_tokens.create({
      data: {
        employer_id: employer.id,
        token_hash,
        issued_at: now,
        expires_at,
        ip: ctx.ip,
        user_agent: ctx.ua,
      },
    });

    setCookie(ctx.res, 'refresh_token', refreshPlain, expires_at);

    const profile = await this.buildAdminProfile(employer.id);
    return { accessToken, user: profile };
  }


  async refreshEmployer(oldToken: string, ctx: { ip: string; ua: string; res: any }) {
    if (!oldToken) throw new ForbiddenException('MISSING_REFRESH');

    const tokens = await this.prisma.employer_refresh_tokens.findMany({
      where: { revoked_at: null },
      orderBy: { issued_at: 'desc' },
    });

    const match = await findMatchingRefreshEmployer(oldToken, tokens);
    if (!match) throw new ForbiddenException('INVALID_REFRESH');

    if (match.expires_at.getTime() < Date.now()) {
      await this.prisma.employer_refresh_tokens.update({ where: { id: match.id }, data: { revoked_at: new Date() } });
      throw new ForbiddenException('REFRESH_EXPIRED');
    }

    // rotate
    await this.prisma.employer_refresh_tokens.update({ where: { id: match.id }, data: { revoked_at: new Date() } });

    const refreshPlain = randomHex(64);
    const token_hash = await bcrypt.hash(refreshPlain, rounds());
    const expires_at = new Date(Date.now() + parseTtlMs(process.env.JWT_REFRESH_TTL ?? '30d'));

    await this.prisma.employer_refresh_tokens.create({
      data: {
        employer_id: match.employer_id,
        token_hash,
        issued_at: new Date(),
        expires_at,
        ip: ctx.ip,
        user_agent: ctx.ua,
      },
    });

    const accessToken = await this.signAccess(match.employer_id, 'superadmin');
    setCookie(ctx.res, 'refresh_token', refreshPlain, expires_at);
    const profile = await this.buildAdminProfile(match.employer_id);
    return { accessToken, user: profile };
  }

  // async loginCandidate(email: string, password: string, ctx: { res: any }) {
  //   const c = await this.prisma.candidates.findFirst({ where: { email, deleted_at: null } });
  //   if (!c) throw new UnauthorizedException('INVALID_CREDENTIALS');
  //   const ok = await bcrypt.compare(password, c.password);
  //   if (!ok) throw new UnauthorizedException('INVALID_CREDENTIALS');
  //   if (!c.email_verified) throw new ForbiddenException('EMAIL_NOT_VERIFIED');

  //   const accessToken = await this.signAccess(c.id, 'candidate');
  //   const { refreshPlain, expires_at } = await this.signRefreshJwt(c.id, 'candidate');
  //   setCookie(ctx.res, 'candidate_refresh_token', refreshPlain, expires_at);

  //   return { accessToken, user: { id: c.id, email: c.email, name: c.name ?? '', phone: c.phone ?? '', last_login: c.last_login ?? null, created_at: c.created_at ?? null } };
  // }

  async loginCandidate(email: string, password: string, ctx: { ip: string; ua: string; res: any }) {

    const candidate = await this.prisma.candidates.findFirst({
      where: { email, deleted_at:null },
    });

    // Do not reveal which factor failed
    if (!candidate || !candidate.password) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    // Safe bcrypt compare
    const ok = await bcrypt.compare(password, candidate.password);
    if (!ok) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const accessToken = await this.signAccess(candidate.id, 'candidate');

    // refresh token cookie
    const refreshPlain = randomHex(64);
    const token_hash = await bcrypt.hash(refreshPlain, rounds());
    const now = new Date();
    const expires_at = new Date(now.getTime() + parseTtlMs(process.env.JWT_REFRESH_TTL ?? '30d'));

    await this.prisma.candidate_refresh_tokens.create({
      data: {
        candidate_id: candidate.id,
        token_hash,
        issued_at: now,
        expires_at,
        ip: ctx.ip,
        user_agent: ctx.ua,
      },
    });

    setCookie(ctx.res, 'refresh_token', refreshPlain, expires_at);

    const profile = await this.buildAdminProfile(candidate.id);
    return { accessToken, user: profile };
  }

  async refreshCandidate(oldToken: string, ctx: { ip: string; ua: string; res: any }) {
    if (!oldToken) throw new ForbiddenException('MISSING_REFRESH');

    const tokens = await this.prisma.candidate_refresh_tokens.findMany({
      where: { revoked_at: null },
      orderBy: { issued_at: 'desc' },
    });

    const match = await findMatchingRefreshCandidate(oldToken, tokens);
    if (!match) throw new ForbiddenException('INVALID_REFRESH');

    if (match.expires_at.getTime() < Date.now()) {
      await this.prisma.candidate_refresh_tokens.update({ where: { id: match.id }, data: { revoked_at: new Date() } });
      throw new ForbiddenException('REFRESH_EXPIRED');
    }

    // rotate
    await this.prisma.candidate_refresh_tokens.update({ where: { id: match.id }, data: { revoked_at: new Date() } });

    const refreshPlain = randomHex(64);
    const token_hash = await bcrypt.hash(refreshPlain, rounds());
    const expires_at = new Date(Date.now() + parseTtlMs(process.env.JWT_REFRESH_TTL ?? '30d'));

    await this.prisma.candidate_refresh_tokens.create({
      data: {
        candidate_id: match.candidate_id,
        token_hash,
        issued_at: new Date(),
        expires_at,
        ip: ctx.ip,
        user_agent: ctx.ua,
      },
    });

    const accessToken = await this.signAccess(match.candidate_id, 'superadmin');
    setCookie(ctx.res, 'refresh_token', refreshPlain, expires_at);
    const profile = await this.buildAdminProfile(match.candidate_id);
    return { accessToken, user: profile };
  }

  async logoutGeneric(oldRefresh: string, typ: string) {
    if (!oldRefresh) return;
    await this.blacklist(oldRefresh, typ);
  }

  // ===== Forgot + Email Verify =====
  async forgot(typ: UserType, email: string) {
    // Don’t leak existence
    const token = await this.jwt.signAsync(
      { email, typ, purpose: 'reset' },
      { secret: process.env.JWT_RESET_SECRET || process.env.JWT_REFRESH_SECRET!, expiresIn: '1h' },
    );
    return { ok: true, token }; // token returned only for testing now
  }

  async verifyEmail(typ: 'candidate' | 'employer', token: string) {
    if (!token) throw new ForbiddenException('MISSING_TOKEN');
    let decoded: any;
    try {
      decoded = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_EMAIL_VERIFY_SECRET || process.env.JWT_ACCESS_SECRET!,
      });
    } catch {
      throw new ForbiddenException('INVALID_TOKEN');
    }
    if (decoded.typ !== typ || decoded.purpose !== 'verify') throw new ForbiddenException('INVALID_TOKEN');

    if (typ === 'candidate') {
      await this.prisma.candidates.update({
        where: { id: decoded.sub },
        data: { email_verified: true, email_verified_at: new Date() },
      });
    } else {
      await this.prisma.employers.update({
        where: { id: decoded.sub },
        data: { email_verified: true, email_verified_at: new Date() },
      });
    }
    return { ok: true };
  }

  // Blacklist plain refresh tokens (non-admin) using bcrypt hash in token_blacklists
  private async isBlacklisted(plain: string) {
    const rows = await this.prisma.token_blacklists.findMany({});
    for (const r of rows) {
      if (r.refresh_token && (await bcrypt.compare(plain, r.refresh_token))) return true;
    }
    return false;
  }

  private async blacklist(plain: string, typ:string) {
    const hashed = await bcrypt.hash(plain, rounds());
    await this.prisma.token_blacklists.create({
      data: { refresh_token: hashed, created_at: new Date(), created_by: typ },
    });
  }

  // VERIFICATIONS
  async verifyEmployerEmail(token: string) {
  const payload = await this.jwt.verifyAsync<{ sub: string; typ: string; purpose: string }>(
    token,
    { secret: process.env.JWT_EMAIL_VERIFY_SECRET || process.env.JWT_ACCESS_SECRET! },
  );
  if (payload.purpose !== 'verify' || payload.typ !== 'employer') {
    throw new ForbiddenException('INVALID_TOKEN');
  }

  const e = await this.prisma.employers.findUnique({ where: { id: payload.sub } });
  if (!e) throw new ForbiddenException('INVALID_TOKEN');

  if (!e.email_verified) {
    await this.prisma.employers.update({
      where: { id: e.id },
      data: { email_verified: true, email_verified_at: new Date() },
    });
  }

  return { verified: true };
  }

  async verifyCandidateEmail(token: string) {
  const payload = await this.jwt.verifyAsync<{ sub: string; typ: string; purpose: string }>(
    token,
    { secret: process.env.JWT_EMAIL_VERIFY_SECRET || process.env.JWT_ACCESS_SECRET! },
  );
  if (payload.purpose !== 'verify' || payload.typ !== 'candidate') {
    throw new ForbiddenException('INVALID_TOKEN');
  }

  const c = await this.prisma.candidates.findUnique({ where: { id: payload.sub } });
  if (!c) throw new ForbiddenException('INVALID_TOKEN');

  if (!c.email_verified) {
    await this.prisma.candidates.update({
      where: { id: c.id },
      data: { email_verified: true, email_verified_at: new Date() },
    });
  }

  return { verified: true };
  }

  //FORGOT PASSWORD
  async forgotAdmin(dto: ForgotPasswordDto) {
    const key = `forgot:admin:${dto.email.toLowerCase()}`;
    const throttled = throttle(key);
    // if (await throttled) {
    //   throw new HttpException('RESET_THROTTLED', HttpStatus.TOO_MANY_REQUESTS); // 429
    // }
    // if (await throttled) throw new TooManyRequestsException('RESET_THROTTLED');

    const admin = await this.prisma.admins.findFirst({
      where: { email: dto.email, deleted_at: null },
    });
    if (!admin) throw new NotFoundException('EMAIL_NOT_FOUND');

    const token = await this.signReset({ email: admin.email, typ: 'admin' });
    const url = buildUrlWithToken(dto.url, token);

    await this.mailer.sendAdminPasswordReset({
      template: 'core/mailer/admin/password_reset.html',
      to: admin.email,
      url,
      subject: 'Reset Password Admin',
      year: new Date().getFullYear().toString(),
    });

    return { ok: true };
  }

  async forgotEmployer(dto: ForgotPasswordDto) {
    const key = `forgot:employer:${dto.email.toLowerCase()}`;
    const throttled = throttle(key);
    if (await throttled) {
      throw new HttpException('RESET_THROTTLED', HttpStatus.TOO_MANY_REQUESTS); // 429
    }
    // if (await throttled) throw new TooManyRequestsException('RESET_THROTTLED');

    const employer = await this.prisma.employers.findFirst({
      where: { email: dto.email, deleted_at: null },
    });
    if (!employer) throw new NotFoundException('EMAIL_NOT_FOUND');

    const token = await this.signReset({ email: employer.email, typ: 'employer' });
    const url = buildUrlWithToken(dto.url, token);

    await this.mailer.sendEmployerPasswordReset({
      template: 'core/mailer/employer/password_reset.html',
      to: employer.email,
      url,
      subject: 'Reset Password Employer',
      year: new Date().getFullYear().toString(),
    });

    return { ok: true };
  }

  async forgotCandidate(dto: ForgotPasswordDto) {
    const key = `forgot:candidate:${dto.email.toLowerCase()}`;
    const throttled = throttle(key);
    if (await throttled) {
      throw new HttpException('RESET_THROTTLED', HttpStatus.TOO_MANY_REQUESTS); // 429
    }

    const candidate = await this.prisma.candidates.findFirst({
      where: { email: dto.email, deleted_at: null },
    });
    if (!candidate) throw new NotFoundException('EMAIL_NOT_FOUND');

    const token = await this.signReset({ email: candidate.email, typ: 'candidate' });
    const url = buildUrlWithToken(dto.url, token);

    await this.mailer.sendCandidatePasswordReset({
      template: 'core/mailer/candidate/password_reset.html',
      to: candidate.email,
      url,
      subject: 'Reset Password Candidate',
      year: new Date().getFullYear().toString(),
    });

    return { ok: true };
  }

  // ===== Reset: Admin / Employer / Candidate =====
  async resetAdmin(dto: ResetPasswordDto) {
    const decoded = await this.verifyReset(dto.token);
    if (decoded.purpose !== 'reset' || decoded.typ !== 'admin') {
      return { ok: true }; // generic
    }
    const pw = await hash(dto.password);

    const admin = await this.prisma.admins.findFirst({ where: { email: decoded.email, deleted_at: null } });
    if (admin) {
      await this.prisma.$transaction([
        this.prisma.admins.update({
          where: { id: admin.id },
          data: { password: pw, updated_at: new Date() },
        }),
        // revoke all active admin refresh tokens
        this.prisma.admin_refresh_tokens.updateMany({
          where: { admin_id: admin.id, revoked_at: null },
          data: { revoked_at: new Date() },
        }),
      ]);
    }
    return { ok: true };
  }

  async resetEmployer(dto: ResetPasswordDto) {
    const decoded = await this.verifyReset(dto.token);
    if (decoded.purpose !== 'reset' || decoded.typ !== 'employer') {
      return { ok: true };
    }
    const pw = await hash(dto.password);

    const emp = await this.prisma.employers.findFirst({ where: { email: decoded.email, deleted_at: null } });
    if (emp) {
      await this.prisma.employers.update({
        where: { id: emp.id },
        data: { password: pw, password_updated_at: new Date() },
      });
    }
    return { ok: true };
  }

  async resetCandidate(dto: ResetPasswordDto) {
    const decoded = await this.verifyReset(dto.token);
    if (decoded.purpose !== 'reset' || decoded.typ !== 'candidate') {
      return { ok: true };
    }
    const pw = await hash(dto.password);

    const cand = await this.prisma.candidates.findFirst({ where: { email: decoded.email, deleted_at: null } });
    if (cand) {
      await this.prisma.candidates.update({
        where: { id: cand.id },
        data: { password: pw, password_updated_at: new Date() },
      });
    }
    return { ok: true };
  }


  //REFRESH TOKEN GENERIC

  async refreshGeneric(oldRefresh: string, typ: Exclude<UserType, 'admin'>, ctx: { ip: string; ua: string; res: any; cookieName: string }) {
    if (!oldRefresh) throw new ForbiddenException('MISSING_REFRESH');

    // reject if blacklisted
    if (await this.isBlacklisted(oldRefresh)) throw new ForbiddenException('REFRESH_REVOKED');

    let decoded: any;
    try {
      decoded = await this.jwt.verifyAsync(oldRefresh, { secret: process.env.JWT_REFRESH_SECRET! });
    } catch {
      throw new ForbiddenException('INVALID_REFRESH');
    }
    if (decoded.typ !== typ) throw new ForbiddenException('INVALID_REFRESH_TYPE');

    // rotate: blacklist old, issue new
    await this.blacklist(oldRefresh, typ);

    const accessToken = await this.signAccess(decoded.sub, typ);
    const { refreshPlain, expires_at } = await this.signRefreshJwt(decoded.sub, typ);
    setCookie(ctx.res, ctx.cookieName, refreshPlain, expires_at);

    // minimal profile by type
    const user =
      typ === 'candidate'
        ? await this.prisma.candidates.findUnique({ where: { id: decoded.sub } })
        : typ === 'employer'
        ? await this.prisma.employers.findUnique({ where: { id: decoded.sub } })
        : await this.prisma.superadmins.findUnique({ where: { id: decoded.sub } });

    return {
      accessToken,
      user: user
        ? {
            id: (user as any).id,
            email: (user as any).email ?? '',
            name: (user as any).name ?? '',
            phone: (user as any).phone ?? '',
            last_login: (user as any).last_login ?? null,
            created_at: (user as any).created_at ?? null,
          }
        : { id: decoded.sub },
    };
  }
}