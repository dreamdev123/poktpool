import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class updateJumio1657222906652 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'jumio',
      new TableColumn({
        name: 'web_href',
        type: 'varchar',
        isNullable: true,
      }),
    );
    await queryRunner.renameColumn('jumio', 'jumio_tx_id', 'account_id');
    await queryRunner.renameColumn('jumio', 'jumio_account_id', 'tx_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('jumio', 'web_href');
    await queryRunner.renameColumn('jumio', 'account_id', 'jumio_tx_id');
    await queryRunner.renameColumn('jumio', 'tx_id', 'jumio_account_id');
  }
}
