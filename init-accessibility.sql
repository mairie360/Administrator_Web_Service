-- Data of the RGAA states of rgaa.yaml (accessibility stack only, run after init-test.sql by the
-- seeder-a11y service of docker-compose-accessibility.yml). ZAP / k6 keep init-test.sql alone.
--
-- Administration rights come from the database (user_roles -> role "Admin", checked by core-api),
-- not from the JWT: without an Admin user every /bff/admin/* call answers 403. Ids 10 and above do
-- not clash with init-test.sql (user 2) nor with the default admin of the migrations (user 1).
-- Fixed dates everywhere; the browser clock of the engine is 2026-01-15T09:00:00+01:00.
--
-- One transaction: the deferred trigger that gives the Guest role to users without a role only
-- runs at COMMIT, once the roles below exist, so no user gets an extra Guest role.
BEGIN;

INSERT INTO users (id, first_name, last_name, email, password, phone_number, status, created_at, updated_at)
VALUES
    -- Administrator of every read-only state.
    (10, 'Camille', 'Administratrice', 'rgaa-admin@mairie360.fr', 'dummy', '0102030405', 'active',
        '2026-01-05 09:00:00+01', '2026-01-05 09:00:00+01'),
    -- Administrator of the only writing state (user-password-reset): states run in parallel.
    (11, 'Dominique', 'Gestionnaire', 'rgaa-writer@mairie360.fr', 'dummy', NULL, 'active',
        '2026-01-05 09:00:00+01', '2026-01-05 09:00:00+01'),
    -- Target of user-password-reset (first row of the table: sorted by last name).
    (12, 'Rémi', 'Aubert', 'remi.aubert@mairie360.fr', 'dummy', NULL, 'active',
        '2026-01-05 09:00:00+01', '2026-01-05 09:00:00+01')
ON CONFLICT (id) DO NOTHING;

-- 25 agents: with the users above, more than one page of 20 (pagination enabled).
INSERT INTO users (id, first_name, last_name, email, password, phone_number, status, created_at, updated_at)
SELECT 19 + n, v.first_name, v.last_name,
       lower(translate(v.first_name || '.' || v.last_name, 'éèçëï ', 'eecei-')) || '@mairie360.fr',
       'dummy', CASE WHEN n % 3 = 0 THEN '01020304' || lpad(n::text, 2, '0') END,
       CASE WHEN n % 7 = 0 THEN 'inactive' ELSE 'active' END,
       '2026-01-06 10:00:00+01'::timestamptz, '2026-01-06 10:00:00+01'::timestamptz
FROM (VALUES
    (1, 'Alice', 'Bernard'), (2, 'Bruno', 'Petit'), (3, 'Chloé', 'Robert'), (4, 'David', 'Richard'),
    (5, 'Emma', 'Durand'), (6, 'François', 'Dubois'), (7, 'Gabrielle', 'Moreau'), (8, 'Hugo', 'Laurent'),
    (9, 'Inès', 'Simon'), (10, 'Julien', 'Michel'), (11, 'Karima', 'Lefebvre'), (12, 'Louis', 'Leroy'),
    (13, 'Manon', 'Roux'), (14, 'Nicolas', 'David'), (15, 'Océane', 'Bertrand'), (16, 'Paul', 'Morel'),
    (17, 'Quitterie', 'Fournier'), (18, 'Rachid', 'Girard'), (19, 'Sophie', 'Bonnet'), (20, 'Thomas', 'Dupont'),
    (21, 'Ursule', 'Lambert'), (22, 'Victor', 'Fontaine'), (23, 'Wendy', 'Rousseau'), (24, 'Xavier', 'Vincent'),
    (25, 'Yasmine', 'Muller')
) AS v(n, first_name, last_name)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.name = CASE
    WHEN u.id IN (10, 11) THEN 'Admin'
    WHEN u.id IN (20, 21) THEN 'Maire'
    WHEN u.id IN (22, 23, 24) THEN 'Responsable'
    ELSE 'User'
END
WHERE u.id = 10 OR u.id = 11 OR u.id = 12 OR u.id BETWEEN 20 AND 44
ON CONFLICT DO NOTHING;

-- Groups (the owner is added as a member by a trigger).
INSERT INTO groups (id, owner_id, name, description, created_at)
VALUES
    (1, 10, 'Services techniques', 'Voirie, bâtiments et espaces verts.', '2026-01-07 09:00:00'),
    (2, 10, 'Conseil municipal', 'Élus et secrétariat du conseil.', '2026-01-07 09:00:00')
ON CONFLICT (id) DO NOTHING;
INSERT INTO group_members (group_id, user_id, joined_at)
-- Typed literals: a UNION resolves untyped ones as text, which a timestamp column refuses.
SELECT 1, id, '2026-01-08 09:00:00'::timestamp FROM users WHERE id BETWEEN 22 AND 27
UNION ALL
SELECT 2, id, '2026-01-08 09:00:00'::timestamp FROM users WHERE id IN (20, 21, 28)
ON CONFLICT DO NOTHING;

-- Sessions of the main administrator (Sessions tab): one active, one revoked, one expired.
-- expires_at is set by a BEFORE INSERT trigger (now() + 7 days), hence the UPDATE.
INSERT INTO sessions (id, user_id, token_hash, device_info, ip_address, created_at)
VALUES
    ('00000000-0000-4000-8000-000000000101', 10, 'rgaa-token-hash-active', 'Firefox 133 sur Ubuntu', '192.0.2.10', '2026-01-14 08:30:00+01'),
    ('00000000-0000-4000-8000-000000000102', 10, 'rgaa-token-hash-revoked', 'Chrome 131 sur Windows 11', '192.0.2.11', '2026-01-10 14:00:00+01'),
    ('00000000-0000-4000-8000-000000000103', 10, 'rgaa-token-hash-expired', 'Safari 18 sur iPhone', '192.0.2.12', '2025-12-20 18:15:00+01')
ON CONFLICT (id) DO NOTHING;
UPDATE sessions SET expires_at = '2030-01-14 08:30:00+01' WHERE id = '00000000-0000-4000-8000-000000000101';
UPDATE sessions SET expires_at = '2030-01-10 14:00:00+01', revoked_at = '2026-01-12 17:45:00+01'
    WHERE id = '00000000-0000-4000-8000-000000000102';
UPDATE sessions SET expires_at = '2025-12-27 18:15:00+01' WHERE id = '00000000-0000-4000-8000-000000000103';

-- Explicit ids do not move the sequences.
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT max(id) FROM users));
SELECT setval(pg_get_serial_sequence('groups', 'id'), (SELECT max(id) FROM groups));

COMMIT;
