import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PoktPoolUser } from 'src/auth/entities/user.entity';
import { Repository } from 'typeorm';
import { Customer } from 'src/auth/entities/customer.entity';
import { CustomerQueryDto } from 'src/customer/dto/customer-query.dto';

@Injectable()
export class CustomerUtilService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async getCustomer(poktPoolUser: PoktPoolUser, customerQueryDto: CustomerQueryDto): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: {
        userId: poktPoolUser.id,
        id: customerQueryDto.customerId,
      },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }
}
