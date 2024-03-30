import { EntitySchema } from 'typeorm';
import { ReportEntity } from './report.entity';

export const ReportSchema = new EntitySchema<ReportEntity>({
  name: 'ReportEntity',
  target: ReportEntity,
  columns: {
    id: {
      name: 'id',
      type: 'char',
      length: 16,
      unique: true,
      primary: true,
    },
    objectAuthorId: {
      name: 'object_author_id',
      type: 'varchar',
      length: 30,
    },
    objectId: {
      name: 'object_id',
      type: 'varchar',
      length: 30,
    },
    objectType: {
      name: 'object_type',
      type: 'int2',
    },
    reportType: {
      name: 'report_type',
      type: 'int2',
    },
    reporterComment: {
      name: 'reporter_comment',
      type: 'varchar',
      nullable: true,
    },
    reporterId: {
      name: 'reporter_id',
      type: 'varchar',
      length: 30,
    },
    reviewReportRequestId: {
      name: 'review_request_id',
      type: 'varchar',
      length: 30,
      nullable: true,
    },
    createdAt: {
      name: 'created_at',
      type: 'timestamp with time zone',
    },
    updatedAt: {
      name: 'updated_at',
      type: 'timestamp without time zone',
    },
  },
  relations: {
    reviewReportRequest: {
      target: 'ReviewReportRequestEntity',
      type: 'many-to-one',
      joinColumn: { name: 'review_request_id' }, //Many reports will have one reviewReportRequest
    },
  },
});
