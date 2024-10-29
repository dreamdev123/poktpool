import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { Customer } from 'src/auth/entities/customer.entity';
import { CustomerService } from './services/customer.service';

@Module({
  imports: [TypeOrmModule.forFeature([PoktPoolUser, Customer])],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}
