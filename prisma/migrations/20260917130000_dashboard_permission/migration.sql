-- The dashboard page has its own permission gate. Keep it in the database
-- vocabulary and grant it to the system super administrator role.
INSERT INTO "permissions" ("id", "key", "module", "action")
VALUES (md5('destiny.permission.dashboard.view')::uuid, 'dashboard.view', 'dashboard', 'view')
ON CONFLICT ("key") DO UPDATE
SET "module" = EXCLUDED."module", "action" = EXCLUDED."action";

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE lower(r."key") = 'super_admin' AND p."key" = 'dashboard.view'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
