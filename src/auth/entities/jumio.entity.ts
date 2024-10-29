import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Jumio {
  @PrimaryGeneratedColumn('uuid', { name: 'poktpool_jumio_uuid' })
  id: string;

  @Column({ nullable: true, name: 'account_id' })
  public accountId: string;

  @Column({ nullable: true, name: 'tx_id' })
  public transactionId: string;

  @Column({ nullable: true, name: 'web_href' })
  public webHref: string;

  @Column({ nullable: true, name: 'user_id' })
  public userId: string;

  @Column({ nullable: true, name: 'age_at_kyc' })
  public ageAtKYC: number;

  @Column({ nullable: true, name: 'gender' })
  public gender: string;

  @Column({ nullable: true, name: 'id_locale' })
  public idLocale: string;

  @Column({ nullable: true, name: 'id_us_state' })
  public idUsState: string;

  @Column({ nullable: true, name: 'kyc_complete_ts' })
  public completedAt: string;

  // // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @OneToOne((_type) => PoktPoolUser, (poktPoolUser) => poktPoolUser.jumio, {
  //   onUpdate: 'CASCADE',
  // })
  // @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  // poktPoolUser: PoktPoolUser;
}
