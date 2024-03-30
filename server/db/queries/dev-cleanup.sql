BEGIN;
SET CONSTRAINTS ALL DEFERRED;
DELETE FROM tag_entity CASCADE;
DELETE from reply_entity CASCADE;
UPDATE comment_entity
SET post_id = NULL;
UPDATE post_entity
SET pinned_comment_id = NULL;
DELETE from comment_entity CASCADE;
DELETE from post_entity CASCADE;
DELETE from user_entity CASCADE;
DELETE from feed_entity CASCADE;
COMMIT;
