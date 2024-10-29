import { IsEnum } from 'class-validator';
import { StakeStatus } from '../enums/stake-status.enum';

export class UpdateStakeStatusDto {
  @IsEnum(StakeStatus)
  stakeStatus: StakeStatus;
}
