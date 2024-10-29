import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PoktPoolUser } from './user.entity';

@Entity()
export class TwoFactorBackupCode {
  @PrimaryGeneratedColumn('uuid', { name: 'backup_code_uuid' })
  id: string;

  @Column({ nullable: false, name: 'code' })
  public code: string;

  @Column({ nullable: false, name: 'user_id' })
  public userId: string;

  @ManyToOne(() => PoktPoolUser, (poktPoolUser) => poktPoolUser.backupCodes)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  poktPoolUser: PoktPoolUser;
}
