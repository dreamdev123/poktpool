import { Exclude } from 'class-transformer';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Jumio } from './jumio.entity';
import { TwoFactorBackupCode } from './two-factor-backup-code.entity';
import { Customer } from './customer.entity';

@Entity()
export class PoktPoolUser {
  @BeforeInsert()
  changeInputCase() {
    this.username = this.username.toLowerCase().trim();
    this.email = this.email.toLowerCase().trim();
  }

  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  public id?: string;

  @Column({ nullable: true, unique: true })
  public username?: string;

  @Column({ nullable: true, name: 'first_name' })
  public firstName?: string;

  @Column({ nullable: true, name: 'last_name' })
  public lastName?: string;

  @Column({ unique: true })
  public email: string;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  public password?: string;

  @Column({ nullable: true, name: 'two_factor_secret' })
  public twoFactorSecret?: string;

  @Column({ nullable: true, default: false })
  public isTwoFactorEnabled?: boolean;

  @Column({ default: false, nullable: true, name: 'is_email_verified' })
  public isEmailVerified?: boolean;

  @Column({ nullable: true, name: 'jumio_decision' })
  public jumioDecision?: string;

  @Column({ nullable: true, name: 'user_icon_url' })
  public userIconUrl?: string;

  @Column({ nullable: true, name: 'jumio_reason' })
  public jumioReason?: string;

  @Column({ nullable: true, name: 'jumio_allow_retry' })
  public jumioAllowRetry?: boolean;

  @Column({ nullable: true, name: 'repeated_face' })
  public repeatedFace?: boolean;

  @Column({ nullable: true, name: 'hashed_refresh_token' })
  @Exclude()
  public hashedRefreshToken?: string;

  @Column({ nullable: true, name: 'last_login_ts' })
  public lastLoginTs: string;

  @Column('bigint', { nullable: true, name: 'password_updated_timestamp' })
  passwordUpdatedTimestamp: number;

  @CreateDateColumn({ name: 'created_on' }) createdOn?: Date;
  @CreateDateColumn({ name: 'updated_on' }) updatedOn?: Date;

  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @OneToOne((_type) => Jumio, (jumio) => jumio.poktPoolUser, {
  //   onUpdate: 'CASCADE',
  // })
  // jumio: Jumio;

  @OneToMany(() => TwoFactorBackupCode, (backupCode) => backupCode.poktPoolUser)
  backupCodes: TwoFactorBackupCode[];

  @OneToOne(() => Customer, (customer) => customer.poktPoolUser)
  customer: Customer;

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword).then((result) => result);
  }
}
