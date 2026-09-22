import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDigitalAssetMediaProcessing1790000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('digitalassets', [
      new TableColumn({
        name: 'media_processing_status',
        type: 'varchar',
        default: "'none'",
      }),
      new TableColumn({
        name: 'media_derivative_prefix',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'media_frame_count',
        type: 'integer',
        isNullable: true,
      }),
      new TableColumn({
        name: 'media_processing_error',
        type: 'text',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('digitalassets', [
      'media_processing_error',
      'media_frame_count',
      'media_derivative_prefix',
      'media_processing_status',
    ]);
  }
}
