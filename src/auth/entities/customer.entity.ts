import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PoktPoolUser } from './user.entity';

@Entity()
export class Customer {
  @PrimaryGeneratedColumn('increment', { name: 'customer_id' })
  id: string;

  @Column({
    name: 'p_wallet_id',
  })
  primaryWalletId: string;

  @Column('int', { nullable: true, name: 'sweep_percent' })
  public sweepPercent: number;

  @Column({ nullable: false, name: 'user_id' })
  public userId: string;

  @Column({ nullable: true, name: 'wallet_nickname' })
  public nickname: string;

  @Column({ name: 'is_active' })
  public isActive: boolean;

  @OneToOne(() => PoktPoolUser, (poktPoolUser) => poktPoolUser.customer)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  poktPoolUser: PoktPoolUser;

  // @OneToOne(() => PoktPoolUser)
  // @JoinColumn()
  // userId: PoktPoolUser;
}
