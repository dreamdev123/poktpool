import { Controller, Get, Query, Post, UseGuards, Body, Patch, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtTwoFactorGuard } from 'src/auth/guards/jwt-two-factor.guard';
import { AdminUtilService } from 'src/pocket/services/admin.util.service';
import { FEATURE } from 'src/admin/enums/admin.enum';
import { AdminSegmentService } from '../services/admin.segment.service';
import { SegmentQueryDto } from '../dto/segment-query.dto';
import { PatchSegmentDto } from '../dto/patch-segment.dto';
import { AdminFeature } from 'src/auth/decorator/admin-feature.decorator';

@ApiTags('PoktPool Admin Segment API')
@Controller('admin-segment')
@AdminFeature(FEATURE.ADMIN_SEGMENT)
@UseGuards(JwtTwoFactorGuard)
export class AdminSegmentController {
  constructor(private adminSegmentService: AdminSegmentService, private adminUtilService: AdminUtilService) {}

  @Get('/pools')
  async getPools() {
    return this.adminSegmentService.getPools();
  }

  @Get('/segments')
  async getSegments(@Query() segmentQueryDto: SegmentQueryDto) {
    return this.adminSegmentService.getSegments(segmentQueryDto);
  }

  @Patch('/segments')
  async patchSegment(@Body() patchSegmentDto: PatchSegmentDto) {
    return this.adminSegmentService.patchSegment(patchSegmentDto);
  }
}
