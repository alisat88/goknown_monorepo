import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateDigitalAssetMediaProvenance1791000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'digitalasset_media_artifacts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'digital_asset_id',
            type: 'uuid',
          },
          {
            name: 'role',
            type: 'varchar',
            length: '32',
          },
          {
            name: 'storage_key',
            type: 'text',
          },
          {
            name: 'mimetype',
            type: 'varchar',
          },
          {
            name: 'file_sha256',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'content_sha256',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'content_hash_scheme',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'derived_from_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'digitalasset_media_artifacts',
      new TableForeignKey({
        name: 'DigitalAssetMediaArtifactsAsset_FK',
        columnNames: ['digital_asset_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'digitalassets',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'digitalasset_media_artifacts',
      new TableForeignKey({
        name: 'DigitalAssetMediaArtifactsDerivedFrom_FK',
        columnNames: ['derived_from_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'digitalasset_media_artifacts',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'digitalasset_media_artifacts',
      new TableIndex({
        name: 'IDX_MEDIA_ARTIFACT_ASSET_ROLE',
        columnNames: ['digital_asset_id', 'role'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'digitalasset_media_artifacts',
      new TableIndex({
        name: 'IDX_MEDIA_ARTIFACT_FILE_SHA256',
        columnNames: ['file_sha256'],
      }),
    );

    await queryRunner.createIndex(
      'digitalasset_media_artifacts',
      new TableIndex({
        name: 'IDX_MEDIA_ARTIFACT_CONTENT_HASH',
        columnNames: ['content_hash_scheme', 'content_sha256'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'digitalasset_content_claims',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'content_sha256',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'content_hash_scheme',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'first_digital_asset_id',
            type: 'uuid',
          },
          {
            name: 'first_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'first_source_file_sha256',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'first_seen_at',
            type: 'timestamptz',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'digitalasset_content_claims',
      new TableIndex({
        name: 'IDX_MEDIA_CONTENT_FIRST_CLAIM',
        columnNames: ['content_hash_scheme', 'content_sha256'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('digitalasset_content_claims');
    await queryRunner.dropTable('digitalasset_media_artifacts');
  }
}
