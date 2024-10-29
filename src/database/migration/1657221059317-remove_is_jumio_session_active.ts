import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class removeIsJumioSessionActive1657221059317 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pokt_pool_user', 'is_jumio_session_active');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pokt_pool_user',
      new TableColumn({
        name: 'is_jumio_session_active',
        type: 'boolean',
        isNullable: true,
      }),
    );
  }
}
