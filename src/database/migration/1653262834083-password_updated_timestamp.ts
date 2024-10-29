import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class passwordUpdatedTimestamp1653262834083 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.addColumn(
    //   'pokt_pool_user',
    //   new TableColumn({
    //     name: 'password_updated_timestamp',
    //     type: 'bigint',
    //     isNullable: true,
    //   }),
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.dropColumn(
    //   'pokt_pool_user',
    //   'password_updated_timestamp',
    // );
  }
}
