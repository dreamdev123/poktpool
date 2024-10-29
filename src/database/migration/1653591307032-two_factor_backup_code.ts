import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class twoFactorBackupCode1653591307032 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.createTable(
    //   new Table({
    //     name: 'two_factor_backup_code',
    //     columns: [
    //       {
    //         name: 'backup_code_uuid',
    //         type: 'uuid',
    //         isPrimary: true,
    //         isGenerated: true,
    //         generationStrategy: 'uuid',
    //       },
    //       {
    //         name: 'code',
    //         type: 'varchar',
    //         isNullable: false,
    //       },
    //       {
    //         name: 'user_id',
    //         type: 'uuid',
    //       },
    //     ],
    //     foreignKeys: [
    //       {
    //         columnNames: ['user_id'],
    //         referencedTableName: 'pokt_pool_user',
    //         referencedColumnNames: ['user_id'],
    //       },
    //     ],
    //   }),
    //   true,
    //   true,
    //   true,
    // );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // await queryRunner.dropTable('two_factor_backup_code');
  }
}
