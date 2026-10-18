-- ==============================================================================
-- 003_seed_movies.sql
-- Deterministically Generate and Seed Exactly 1,000 Realistic Movie Records
-- Target: PostgreSQL 16+
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- Deterministic Generation of Exactly 1,000 Movies
-- Using pure PostgreSQL SQL with generate_series(1, 1000)
-- ------------------------------------------------------------------------------
WITH subclass_catalog AS (
    -- Number each subclass deterministically to ensure uniform distribution
    SELECT 
        ROW_NUMBER() OVER (ORDER BY class_metaid, metaid) AS sc_id,
        class_metaid,
        metaid AS subclass_metaid,
        name AS subclass_name
    FROM subclass
),
catalog_metrics AS (
    SELECT COUNT(*)::int AS total_subclasses FROM subclass_catalog
),
word_banks AS (
    SELECT 
        ARRAY[
            'The Last', 'Shadow of', 'Echoes of', 'Chronicles of', 'Beyond the',
            'Whispers in the', 'Return of', 'Secret of', 'The Edge of', 'Legacy of',
            'Journey to', 'Song of', 'Fires of', 'Ghosts of', 'Kingdom of',
            'The Lost', 'Code of', 'City of', 'Heart of', 'Wings of',
            'Tears of', 'Dawn of', 'Night of', 'Flight of', 'Winds of',
            'Empire of', 'Rise of', 'Fall of', 'Vengeance of', 'The Dark',
            'Silent', 'Hidden', 'Forgotten', 'Iron', 'Crimson',
            'Golden', 'Midnight', 'Broken', 'Infinite', 'Eternal',
            'Neon', 'Velvet', 'Starlight', 'Obsidian', 'Savage',
            'Reckless', 'Untamed', 'Fierce', 'Solitary', 'Phantom'
        ]::text[] AS prefixes,

        ARRAY[
            'Horizon', 'Kingdom', 'Shadow', 'Odyssey', 'Protocol',
            'Prophecy', 'Labyrinth', 'Echo', 'Winter', 'Reckoning',
            'Sanctuary', 'Illusion', 'Frontier', 'Alliance', 'Rebellion',
            'Dynasty', 'Paradox', 'Voyage', 'Symphony', 'Eclipse',
            'Courage', 'Destiny', 'Signal', 'Mirage', 'Covenant',
            'Legacy', 'Enigma', 'Tide', 'Vortex', 'Ascent',
            'Haven', 'Sovereign', 'Tempest', 'Requiem', 'Pact',
            'Threshold', 'Passage', 'Conspiracy', 'Summit', 'Vanguard',
            'Nemesis', 'Glory', 'Exile', 'Deliverance', 'Verdict',
            'Citadel', 'Specter', 'Chronicle', 'Embers', 'Talisman'
        ]::text[] AS nouns,

        ARRAY[
            '', ' Part I', ' Part II', ' Redux', ' Legacy', ' Reborn', ' Unleashed', ' Awakening',
            ' Protocol', ' Chronicles', ' Forever', ' Origins', ' Retribution', ' Salvation',
            ' Genesis', ' Aftermath', ' Resurgence', ' Continuum', ' Directive', ' Dominion'
        ]::text[] AS suffixes,

        ARRAY[
            'Christopher Nolan', 'Denis Villeneuve', 'Greta Gerwig', 'Hayao Miyazaki', 'Bong Joon-ho',
            'Guillermo del Toro', 'Martin Scorsese', 'Steven Spielberg', 'David Fincher', 'Ridley Scott',
            'Quentin Tarantino', 'Alfonso Cuaron', 'Wes Anderson', 'Sofia Coppola', 'Stanley Kubrick',
            'Alfred Hitchcock', 'Akira Kurosawa', 'Federico Fellini', 'Ingmar Bergman', 'Jean-Luc Godard',
            'Francois Truffaut', 'Wong Kar-wai', 'Park Chan-wook', 'Chloe Zhao', 'Kathryn Bigelow',
            'Jane Campion', 'Spike Lee', 'Jordan Peele', 'Taika Waititi', 'Paul Thomas Anderson',
            'Joel Coen', 'David Lynch', 'George Miller', 'James Cameron', 'Peter Jackson',
            'Alejandro Inarritu', 'Michael Mann', 'Sam Mendes', 'Lana Wachowski', 'Lilly Wachowski',
            'Damien Chazelle', 'Yorgos Lanthimos', 'Celine Sciamma', 'Pedro Almodovar', 'Lars von Trier',
            'Hirokazu Kore-eda', 'Abbas Kiarostami', 'Asghar Farhadi', 'Mira Nair', 'Claire Denis'
        ]::text[] AS directors,

        ARRAY[
            'en', 'fr', 'es', 'de', 'ja', 'it', 'ko', 'sv', 'pt', 'zh'
        ]::text[] AS languages,

        ARRAY[
            'A gripping narrative examining morality, sacrifice, and the relentless pursuit of truth.',
            'An intense visual odyssey following a troubled visionary caught in an escalating conflict.',
            'A compelling human drama exploring identity, memory, and the unseen bonds between strangers.',
            'A high-stakes adventure where every decision carries monumental consequences for the future.',
            'A profound meditation on ambition, solitude, and the fragile line between victory and despair.',
            'A mesmerizing cinematic experience blending sharp intellect with unrelenting dramatic tension.',
            'A breathtaking story of resilience against overwhelming natural and societal adversaries.',
            'A complex web of intrigue where personal loyalties are tested by unforgiving betrayals.'
        ]::text[] AS descriptions
),
generated_movies AS (
    SELECT 
        i AS object_id,
        
        -- Generate 1,000 100% unique, realistic cinematic titles
        TRIM(
            wb.prefixes[((i * 17) + 3) % array_length(wb.prefixes, 1) + 1] || ' ' ||
            wb.nouns[((i * 31) + 7) % array_length(wb.nouns, 1) + 1] ||
            wb.suffixes[(i / 50) % array_length(wb.suffixes, 1) + 1]
        ) AS title,

        -- Plausible release years from 1955 to 2024
        (1955 + ((i * 13) % 70))::int AS release_year,

        -- Realistic varied directors
        wb.directors[((i * 7) + 11) % array_length(wb.directors, 1) + 1] AS director,

        -- Engaging descriptive summary
        wb.descriptions[((i * 5) + 3) % array_length(wb.descriptions, 1) + 1] || 
        ' Showcases hallmark elements of ' || sc.subclass_name || ' storytelling.' AS description,

        -- Class and Subclass guaranteed to match
        sc.class_metaid AS class_val,
        sc.subclass_metaid AS subclass_val,

        -- Semantic object metaid assignment
        CASE 
            WHEN sc.class_metaid = 'class:documentary' THEN 'object:documentary_feature'
            WHEN sc.class_metaid = 'class:animation' THEN 'object:animated_feature'
            WHEN (i % 19) = 0 THEN 'object:anthology_feature'
            ELSE 'object:feature_film'
        END AS metaid_val,

        -- Plausible runtimes between 75 and 195 minutes
        (75 + ((i * 11) % 120))::int AS runtime_minutes,

        -- Realistic ratings between 5.5 and 9.7
        ROUND((5.5 + (((i * 29) % 43)::numeric / 10.0)), 1) AS rating,

        -- Varied international language distribution
        wb.languages[((i * 3) + 5) % array_length(wb.languages, 1) + 1] AS original_language,

        -- Progressive creation timestamps over past 3 years
        (CURRENT_TIMESTAMP - (INTERVAL '1 day' * (1001 - i))) AS created_at,
        (CURRENT_TIMESTAMP - (INTERVAL '1 day' * (1001 - i))) AS updated_at

    FROM generate_series(1, 1000) AS i
    CROSS JOIN word_banks wb
    CROSS JOIN catalog_metrics cm
    JOIN subclass_catalog sc ON sc.sc_id = (((i - 1) % cm.total_subclasses) + 1)
)
INSERT INTO object (
    object_id,
    title,
    release_year,
    director,
    description,
    "class",
    subclass,
    metaid,
    runtime_minutes,
    rating,
    original_language,
    created_at,
    updated_at
)
SELECT 
    object_id,
    title,
    release_year,
    director,
    description,
    class_val,
    subclass_val,
    metaid_val,
    runtime_minutes,
    rating,
    original_language,
    created_at,
    updated_at
FROM generated_movies
ON CONFLICT (object_id) DO UPDATE
    SET title = EXCLUDED.title,
        release_year = EXCLUDED.release_year,
        director = EXCLUDED.director,
        description = EXCLUDED.description,
        "class" = EXCLUDED."class",
        subclass = EXCLUDED.subclass,
        metaid = EXCLUDED.metaid,
        runtime_minutes = EXCLUDED.runtime_minutes,
        rating = EXCLUDED.rating,
        original_language = EXCLUDED.original_language,
        updated_at = CURRENT_TIMESTAMP;

-- Reset sequence to ensure future manual inserts use correct next ID
SELECT setval(pg_get_serial_sequence('object', 'object_id'), coalesce(max(object_id), 1), true) FROM object;

COMMIT;
