import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  sendMail({ to, subject, text, html }: { to: string; subject: string; text?: string; html?: string }) {
    sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    return sgMail.send({
      from: this.configService.get('fromEmail'),
      to,
      subject,
      text,
      html,
    });
  }

  sendTemplateEmail({
    to,
    templateId,
    dynamicTemplateData,
  }: {
    to: string;
    templateId: string;
    dynamicTemplateData: any;
  }) {
    sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    return sgMail.send({
      to: to,
      from: this.configService.get('fromEmail'),
      templateId,
      dynamicTemplateData,
    });
  }

  sendBulkTemplateEmail({
    emails,
    templateId,
    dynamicTemplateData,
  }: {
    emails: string[];
    templateId: string;
    dynamicTemplateData: any;
  }) {
    sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    return sgMail.sendMultiple({
      to: emails,
      from: this.configService.get('fromEmail'),
      templateId,
      dynamicTemplateData,
    });
  }
}
