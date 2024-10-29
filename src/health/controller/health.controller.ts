import { CacheInterceptor, Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@UseInterceptors(CacheInterceptor)
@ApiTags('PoktPool API Health Checks')
@Controller('health')
class HealthController {
  @Get()
  check() {
    return { v: 1 };
  }

  @Get('/version')
  getVersion() {
    return { v: 1 };
  }
}

export default HealthController;
