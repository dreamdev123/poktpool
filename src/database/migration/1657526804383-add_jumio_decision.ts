import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class addJumioDecision1657526804383 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'pokt_pool_user',
      new TableColumn({
        name: 'jumio_decision',
        type: 'varchar',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('pokt_pool_user', 'jumio_decision');
  }
}
