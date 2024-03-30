DELETE FROM timepoint_entity
WHERE id LIKE 'U_%';


DO $$
DECLARE
  i INT := 0;
  sharding_factor_count INT := 10;
BEGIN
  WHILE i < sharding_factor_count LOOP
    INSERT INTO timepoint_entity (id, sharding_factor, total_notifications, notification_tuples, process_metadata, state, created_at, updated_at)
    VALUES (
      'U_' || i,
      sharding_factor_count,
      1,
      '[{"recipientId": "", "notificationType": 1}]'::jsonb,
      jsonb_build_object('startDate', NOW(), 'expirationDate', NOW() + INTERVAL '1 minute')::jsonb,
      1,
      NOW(),
      NOW()
    );

    i := i + 1;
  END LOOP;
END $$;



UPDATE timepoint_entity t
SET notification_tuples = (
    SELECT jsonb_agg(jsonb_build_object('recipientId', u.id, 'notificationType', 1))
    FROM user_entity u
    WHERE t.id = 'U_' || ABS(hashtext(u.id)) % t.sharding_factor
    GROUP BY t.id
)
WHERE EXISTS (
    SELECT 1
    FROM user_entity u
    WHERE t.id = 'U_' || ABS(hashtext(u.id)) % t.sharding_factor
);

UPDATE timepoint_entity t
SET total_notifications = (
    SELECT COALESCE(SUM(jsonb_array_length(notification_tuples)), 0)
    FROM timepoint_entity
    WHERE t.id = id
);