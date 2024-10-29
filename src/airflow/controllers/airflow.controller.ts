import { Controller, Ip, Post, UnauthorizedException } from '@nestjs/common';
import { NotificationService } from 'src/pocket/services/notification.service';

@Controller('airflow')
export class AirflowController {
  constructor(private notificationService: NotificationService) {}

  @Post('/send-monthly-statement')
  async sendMonthlyStatement(@Ip() ip: string) {
    const airflowIps = [
      '172.19.100.40',
      '172.19.100.41',
      '172.19.100.42',
      '172.19.100.50',
      '172.19.100.51',
      '172.19.100.52',
    ];
    if (!airflowIps.includes(ip)) {
      throw new UnauthorizedException('Unauthorized');
    }

    await this.notificationService.sendMonthlyStatement();
  }
}
