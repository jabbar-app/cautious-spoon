import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { HttpException } from '@nestjs/common';

type AnyMap = Record<string, any>;

export type SendParams = {
  template: string;
  to: string;
  subject: string;
  context?: AnyMap;
};

export type SimpleWrapperParams = {
  template: string;
  to: string;
  url: string;
  subject: string;
} & AnyMap;

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;
  private cache = new Map<string, Handlebars.TemplateDelegate>();

  private get templatesRoot() {
    // When compiled, __dirname === dist/src/core/mailer
    return path.join(__dirname, 'templates');
  }

  // ---------- Transport ----------
  private getOrCreateTransport() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured; emails will be logged to console only.');
      return null;
    }
    this.transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    return this.transporter;
  }

  // ---------- Template loading ----------
  private compile(absPath: string) {
    const raw = fs.readFileSync(absPath, 'utf8');
    const tpl = Handlebars.compile(raw);
    this.cache.set(absPath, tpl);
    return tpl;
  }

  private resolveTemplateFile(template: string): string {
    if (path.isAbsolute(template) && fs.existsSync(template)) {
      return template;
    }

    const clean = template.replace(/^(\.?\/)?(src|dist)\//, '');

    const candidates = [
      path.resolve(__dirname, clean),
      path.resolve(__dirname, '../../../', clean),
      path.join(process.cwd(), clean),
      path.join(process.cwd(), 'dist', clean),
      path.join(process.cwd(), 'dist', 'src', clean),
      path.join(process.cwd(), 'src', clean),
    ];

    for (const p of candidates) {
      try {
        if (fs.existsSync(p)) return p;
      } catch {
      }
    }

    throw new HttpException(
      { code: 'TEMPLATE_NOT_FOUND', message: template },
      500,
    );
  }

  private render(templateRelPath: string, context: AnyMap = {}) {
    const abs = this.resolveTemplateFile(templateRelPath);
    const tpl = this.cache.get(abs) ?? this.compile(abs);

    const defaults = {
      year: new Date().getFullYear(),
      appName: process.env.BRAND_APP_NAME || 'Talent Desk',
      supportEmail: process.env.BRAND_SUPPORT_EMAIL || 'support@example.com',
    };

    return tpl({ ...defaults, ...context });
  }

  // ---------- Public API ----------
  async send({ template, to, subject, context = {} }: SendParams) {
    const html = this.render(template, context);
    const t = this.getOrCreateTransport();

    if (!t) {
      this.logger.log(`[DEV] Would email to=${to}, subject="${subject}", template="${template}"`);
      this.logger.log(html);
      return { queued: false, devLogged: true };
    }

    const from = process.env.MAIL_FROM || 'Talent Indonesia <no-reply@talent-indonesia.id>';
    await t.sendMail({ from, to, subject, html });
    return { queued: true };
  }


  async sendVerifyCandidate(params: SimpleWrapperParams) {
    const { template, to, url, subject, ...rest } = params;
    return this.send({
      template,
      to,
      subject: subject ?? 'Verify your email',
      context: { url, ...rest },
    });
  }

  async sendVerifyEmployer(params: SimpleWrapperParams) {
    const { template, to, url, subject, ...rest } = params;
    return this.send({
      template,
      to,
      subject: subject ?? 'Verify your employer account',
      context: { url, ...rest },
    });
  }

  async sendForgotCandidate(params: SimpleWrapperParams) {
    const { template, to, url, subject, ...rest } = params;
    return this.send({
      template,
      to,
      subject: subject ?? 'Reset your password',
      context: { url, ...rest },
    });
  }

  async sendAdminPasswordReset(params: SimpleWrapperParams) {
    const { template, to, url, subject, ...rest } = params;
    return this.send({
     template,
      to,
      subject: subject ?? 'Reset your password',
      context: { url, ...rest },
      });
  }

  async sendEmployerPasswordReset(params: SimpleWrapperParams) {
    const { template, to, url, subject, ...rest } = params;
    return this.send({
     template,
      to,
      subject: subject ?? 'Reset your password',
      context: { url, ...rest },
    });
  }

  async sendCandidatePasswordReset(params: SimpleWrapperParams) {
    const { template, to, url, subject, ...rest } = params;
    return this.send({
     template,
      to,
      subject: subject ?? 'Reset your password',
      context: { url, ...rest },
    });
  }

  async sendForgotEmployer(params: SimpleWrapperParams) {
    const { template, to, url, subject, ...rest } = params;
    return this.send({
      template,
      to,
      subject: subject ?? 'Reset your password',
      context: { url, ...rest },
    });
  }
}
