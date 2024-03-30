import { EntitySchema } from 'typeorm';
import { ReviewReportRequestEntity } from './reviewReportRequest.entity';

export const ReviewReportRequestSchema =
  new EntitySchema<ReviewReportRequestEntity>({
    name: 'ReviewReportRequestEntity',
    target: ReviewReportRequestEntity,
    columns: {
      id: {
        name: 'id',
        type: 'char',
        length: 16,
        unique: true,
        primary: true,
      },
      readableNumericId: {
        name: 'readable_numeric_id',
        type: 'numeric',
        unique: true,
      },
      reportedObjectAuthorId: {
        name: 'reported_object_author_id',
        type: 'varchar',
        length: 30,
      },
      reportedObjectId: {
        name: 'reported_object_id',
        type: 'varchar',
        length: 16,
      },
      reportedObjectType: {
        name: 'object_type',
        type: 'int2',
      },
      reviewerId: {
        name: 'reviewer_id',
        type: 'varchar',
        length: 30,
        nullable: true,
      },
      reviewerComment: {
        name: 'reviewer_comment',
        type: 'varchar',
        nullable: true,
      },
      reviewState: {
        name: 'review_state',
        type: 'int2',
      },
      reviewResult: {
        name: 'review_result',
        type: 'int2',
      },
      reportsCount: {
        name: 'reports_count',
        type: 'int',
        default: 0,
      },
      createdAt: {
        name: 'created_at',
        type: 'timestamp with time zone',
      },
      updatedAt: {
        name: 'updated_at',
        type: 'timestamp without time zone',
      },
      reportIds: {
        name: 'report_ids',
        type: 'simple-array',
        nullable: false,
      },
      violatedGuideline: {
        name: 'violated_guideline',
        type: 'integer',
        nullable: true,
      },
      // reporterIds: {
      //   name: 'reporter_ids',
      //   type: 'simple-array',
      //   nullable: false,
      // },
    },
    relations: {
      reports: {
        target: 'ReportEntity',
        type: 'one-to-many',
        joinColumn: true,
      },
    },
  });
