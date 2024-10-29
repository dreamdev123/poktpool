import { SetMetadata } from '@nestjs/common';
import { FEATURE } from 'src/admin/enums/admin.enum';

export const AdminFeature = (featureId: FEATURE) => SetMetadata('admin_feature_id', featureId);
