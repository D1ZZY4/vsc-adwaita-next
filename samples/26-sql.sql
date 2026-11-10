-- SQL: DDL, DML, joins, window functions, CTEs.
-- Exercises: statement keywords, DDL and DML, aliases, table and column
-- names, string and numeric literals, operators, comments.

CREATE TABLE IF NOT EXISTS surfaces (
    id         INTEGER PRIMARY KEY,
    name       VARCHAR(64)  NOT NULL UNIQUE,
    elevation  SMALLINT     NOT NULL DEFAULT 0,
    recessed   BOOLEAN      NOT NULL DEFAULT FALSE,
    tones      TEXT[]       NOT NULL DEFAULT '{}',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT surfaces_elevation_range CHECK (elevation BETWEEN 0 AND 7)
);

CREATE INDEX surfaces_elevation_idx ON surfaces (elevation DESC, name ASC);

INSERT INTO surfaces (name, elevation, recessed, tones)
VALUES
    ('view', 0, TRUE, ARRAY['light_2', 'dark_3']),
    ('window', 1, FALSE, '{}'),
    ('sidebar', 2, FALSE, ARRAY['blue_3', 'teal_2']),
    ('dialog', 3, FALSE, '{}')
ON CONFLICT (name) DO UPDATE
    SET elevation = EXCLUDED.elevation,
        recessed = EXCLUDED.recessed;

WITH ranked AS (
    SELECT
        s.id,
        s.name,
        s.elevation,
        ROW_NUMBER() OVER (PARTITION BY s.elevation ORDER BY s.name) AS rn,
        COUNT(*) OVER () AS total,
        LAG(s.elevation) OVER (ORDER BY s.elevation) AS previous_level
    FROM surfaces AS s
    WHERE s.elevation >= 0
)
SELECT
    r.id,
    r.name,
    r.elevation,
    r.rn,
    r.total,
    COALESCE(r.previous_level, -1) AS previous_level,
    CASE
        WHEN r.elevation < 2 THEN 'recessed'
        WHEN r.elevation = 3 THEN 'overlay'
        ELSE 'chrome'
    END AS kind,
    array_to_string(r.tones, ', ') AS tone_list
FROM ranked AS r
ORDER BY r.elevation ASC, r.name DESC
LIMIT 10 OFFSET 0;

SELECT
    s.name,
    COUNT(t.id) AS tone_count,
    AVG(s.elevation)::NUMERIC(4, 2) AS average_level,
    MAX(s.created_at) AS newest
FROM surfaces AS s
LEFT JOIN tones AS t ON t.surface_id = s.id
GROUP BY s.name
HAVING COUNT(t.id) > 0
ORDER BY tone_count DESC;

UPDATE surfaces
SET recessed = (elevation < 2)
WHERE name IN ('view', 'window', 'sidebar', 'dialog');

DELETE FROM surfaces WHERE elevation > 7;

BEGIN;
SAVEPOINT before_drop;
DROP TABLE IF EXISTS tones;
ROLLBACK TO SAVEPOINT before_drop;
COMMIT;
