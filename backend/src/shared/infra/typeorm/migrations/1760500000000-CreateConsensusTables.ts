import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableUnique,
} from 'typeorm';

export class CreateConsensusTables1760500000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'consensus_proposals',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'proposal_id',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'transaction_sync_id',
            type: 'varchar',
          },
          {
            name: 'payload_hash',
            type: 'varchar',
          },
          {
            name: 'payload',
            type: 'jsonb',
          },
          {
            name: 'originating_node',
            type: 'varchar',
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'approval_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'rejection_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'failure_reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'finalized_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'consensus_proposals',
      new TableIndex({
        name: 'IDX_CONSENSUS_PROPOSALS_TRANSACTION_SYNC_ID',
        columnNames: ['transaction_sync_id'],
      }),
    );

    await queryRunner.createIndex(
      'consensus_proposals',
      new TableIndex({
        name: 'IDX_CONSENSUS_PROPOSALS_PAYLOAD_HASH',
        columnNames: ['payload_hash'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'consensus_votes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'proposal_id',
            type: 'varchar',
          },
          {
            name: 'transaction_sync_id',
            type: 'varchar',
          },
          {
            name: 'node_name',
            type: 'varchar',
          },
          {
            name: 'vote',
            type: 'varchar',
          },
          {
            name: 'reason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'payload_hash',
            type: 'varchar',
          },
          {
            name: 'signature',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createUniqueConstraint(
      'consensus_votes',
      new TableUnique({
        name: 'UQ_CONSENSUS_VOTES_PROPOSAL_NODE',
        columnNames: ['proposal_id', 'node_name'],
      }),
    );

    await queryRunner.createIndex(
      'consensus_votes',
      new TableIndex({
        name: 'IDX_CONSENSUS_VOTES_PROPOSAL_ID',
        columnNames: ['proposal_id'],
      }),
    );

    await queryRunner.createIndex(
      'consensus_votes',
      new TableIndex({
        name: 'IDX_CONSENSUS_VOTES_TRANSACTION_SYNC_ID',
        columnNames: ['transaction_sync_id'],
      }),
    );

    await queryRunner.createIndex(
      'consensus_votes',
      new TableIndex({
        name: 'IDX_CONSENSUS_VOTES_PAYLOAD_HASH',
        columnNames: ['payload_hash'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'consensus_votes',
      'IDX_CONSENSUS_VOTES_PAYLOAD_HASH',
    );
    await queryRunner.dropIndex(
      'consensus_votes',
      'IDX_CONSENSUS_VOTES_TRANSACTION_SYNC_ID',
    );
    await queryRunner.dropIndex(
      'consensus_votes',
      'IDX_CONSENSUS_VOTES_PROPOSAL_ID',
    );
    await queryRunner.dropUniqueConstraint(
      'consensus_votes',
      'UQ_CONSENSUS_VOTES_PROPOSAL_NODE',
    );
    await queryRunner.dropTable('consensus_votes');
    await queryRunner.dropIndex(
      'consensus_proposals',
      'IDX_CONSENSUS_PROPOSALS_PAYLOAD_HASH',
    );
    await queryRunner.dropIndex(
      'consensus_proposals',
      'IDX_CONSENSUS_PROPOSALS_TRANSACTION_SYNC_ID',
    );
    await queryRunner.dropTable('consensus_proposals');
  }
}
