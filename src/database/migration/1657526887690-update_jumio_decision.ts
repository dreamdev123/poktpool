import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateJumioDecision1657526887690 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE pokt_pool_user SET jumio_decision = 'PASSED' WHERE is_jumio_verified = true;`,
    );
  }

  public async down(): Promise<void> {
    console.log('nothing to do');
  }
}
