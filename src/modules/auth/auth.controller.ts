import { Body, Controller, Get, HttpCode ,HttpStatus, Ip, Post, Query, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterEmployerDto } from './dto/register-employer.dto';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { ResendVerifyDto } from './dto/resend-verify.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ===== Super Admin =====
  @Post('superadmin/login')
  @HttpCode(HttpStatus.OK)
  async superLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.loginSuperadmin(dto.email, dto.password, { res });
  }

  @Post('superadmin/refresh')
  @HttpCode(HttpStatus.OK)
  async superRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const ua = req.get('user-agent') ?? '';
    const oldToken = (req as any).cookies?.super_refresh_token ?? '';
    return this.auth.refreshGeneric(oldToken, 'superadmin', { ip, ua, res, cookieName: 'super_refresh_token' });
  }

  @Post('superadmin/logout')
  async superLogout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldToken = (req as any).cookies?.super_refresh_token ?? '';
    await this.auth.logoutGeneric(oldToken);
    res.clearCookie('super_refresh_token', { path: '/' });
    return { success: true };
  }
  // ===== Admin =====
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const ua = req.get('user-agent') ?? '';
    return this.auth.loginAdmin(dto.email, dto.password, { ip, ua, res });
  }

  @Post('admin/refresh')
  @HttpCode(HttpStatus.OK)
  async adminRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const ua = req.get('user-agent') ?? '';
    const oldToken = (req as any).cookies?.refresh_token ?? '';
    return this.auth.refreshAdmin(oldToken, { ip, ua, res });
  }

  @Post('admin/logout')
  async adminLogout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldToken = (req as any).cookies?.refresh_token ?? '';
    await this.auth.logoutAdmin(oldToken);
    res.clearCookie('refresh_token', { path: '/' });
    return { success: true };
  }

  @Post('admin/forgot')
  async adminForgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotAdmin(dto);
  }

  @Post('admin/reset')
  async adminReset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetAdmin(dto);
  }

  // ===== Employer =====
  @Post('employer/register')
  async registerEmployer(@Body() dto: RegisterEmployerDto, @Res({ passthrough: true }) res: Response) {
    const data = await this.auth.registerEmployer(dto, { res });
    return {
      success: true,
      message: 'Verification email sent',
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (res.req as any).id ?? undefined,
        traceId: null,
        version: 'unversioned',
      },
      pagination: null,
      links: null,
    };
  }

  @Post('employer/login')
  @HttpCode(HttpStatus.OK)
  async employerLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.loginEmployer(dto.email, dto.password, { res });
  }

  @Post('employer/refresh')
  @HttpCode(HttpStatus.OK)
  async employerRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const ua = req.get('user-agent') ?? '';
    const oldToken = (req as any).cookies?.employer_refresh_token ?? '';
    return this.auth.refreshGeneric(oldToken, 'employer', { ip, ua, res, cookieName: 'employer_refresh_token' });
  }

  @Post('employer/logout')
  async employerLogout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldToken = (req as any).cookies?.employer_refresh_token ?? '';
    await this.auth.logoutGeneric(oldToken);
    res.clearCookie('employer_refresh_token', { path: '/' });
    return { success: true };
  }

  @Get('employer/verify')
  async verifyEmployer(@Query('token') token: string, @Res({ passthrough: true }) res: Response) {
    const data = await this.auth.verifyEmployerEmail(token);
    return {
      success: true,
      message: 'Email verified',
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (res.req as any).id ?? undefined,
        traceId: null,
        version: 'unversioned',
      },
      pagination: null,
      links: null,
    };
  }

  @Post('employer/resend-verify')
  async resendEmployerVerify(@Body() dto: ResendVerifyDto) {
    return this.auth.resendEmployerVerify(dto);
  }

  @Post('employer/forgot')
  async employerForgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotEmployer(dto);
  }

  @Post('employer/reset')
  async employerReset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetEmployer(dto);
  }
  // ===== Candidate =====
  @Post('candidate/register')
  async registerCandidate(@Body() dto: RegisterCandidateDto, @Res({ passthrough: true }) res: Response) {
    const data = await this.auth.registerCandidate(dto, { res });
    return {
      success: true,
      message: 'Verification email sent',
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (res.req as any).id ?? undefined,
        traceId: null,
        version: 'unversioned',
      },
      pagination: null,
      links: null,
    };
  }

  @Post('candidate/login')
  async candidateLogin(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.auth.loginCandidate(dto.email, dto.password, { res });
  }

  @Post('candidate/refresh')
  @HttpCode(HttpStatus.OK)
  async candidateRefresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const ua = req.get('user-agent') ?? '';
    const oldToken = (req as any).cookies?.candidate_refresh_token ?? '';
    return this.auth.refreshGeneric(oldToken, 'candidate', { ip, ua, res, cookieName: 'candidate_refresh_token' });
  }

  @Post('candidate/logout')
  async candidateLogout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const oldToken = (req as any).cookies?.candidate_refresh_token ?? '';
    await this.auth.logoutGeneric(oldToken);
    res.clearCookie('candidate_refresh_token', { path: '/' });
    return { success: true };
  }

  @Get('candidate/verify')
  async verifyCandidate(@Query('token') token: string, @Res({ passthrough: true }) res: Response) {
    const data = await this.auth.verifyCandidateEmail(token);
    return {
      success: true,
      message: 'Email verified',
      data,
      error: null,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (res.req as any).id ?? undefined,
        traceId: null,
        version: 'unversioned',
      },
      pagination: null,
      links: null,
    };
  }

  @Post('candidate/resend-verify')
  async resendCandidateVerify(@Body() dto: ResendVerifyDto) {
    return this.auth.resendCandidateVerify(dto);
  }

  @Post('candidate/forgot')
  async candidateForgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotCandidate(dto);
  }

  @Post('candidate/reset')
  async candidateReset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetCandidate(dto);
  }
}

