-- ==============================================================================
-- 002_seed_metadata.sql
-- Seed Canonical Taxonomy, Metadata Registry, Classes, Subclasses, and Definitions
-- Target: PostgreSQL 16+
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Seed Metadata Registry
-- ------------------------------------------------------------------------------
INSERT INTO metadata_registry (metaid, entity_type) VALUES
    -- Classes (14)
    ('class:action', 'class'),
    ('class:adventure', 'class'),
    ('class:animation', 'class'),
    ('class:comedy', 'class'),
    ('class:crime', 'class'),
    ('class:documentary', 'class'),
    ('class:drama', 'class'),
    ('class:fantasy', 'class'),
    ('class:horror', 'class'),
    ('class:mystery', 'class'),
    ('class:romance', 'class'),
    ('class:sci_fi', 'class'),
    ('class:thriller', 'class'),
    ('class:western', 'class'),

    -- Subclasses for Action
    ('subclass:martial_arts', 'subclass'),
    ('subclass:superhero', 'subclass'),
    ('subclass:action_thriller', 'subclass'),
    ('subclass:military_action', 'subclass'),

    -- Subclasses for Adventure
    ('subclass:swashbuckler', 'subclass'),
    ('subclass:treasure_hunt', 'subclass'),
    ('subclass:survival', 'subclass'),

    -- Subclasses for Animation
    ('subclass:cgi_3d', 'subclass'),
    ('subclass:traditional_2d', 'subclass'),
    ('subclass:stop_motion', 'subclass'),
    ('subclass:anime', 'subclass'),

    -- Subclasses for Comedy
    ('subclass:romantic_comedy', 'subclass'),
    ('subclass:satire', 'subclass'),
    ('subclass:dark_comedy', 'subclass'),
    ('subclass:slapstick', 'subclass'),

    -- Subclasses for Crime
    ('subclass:detective', 'subclass'),
    ('subclass:gangster', 'subclass'),
    ('subclass:heist', 'subclass'),
    ('subclass:true_crime', 'subclass'),

    -- Subclasses for Documentary
    ('subclass:nature_wildlife', 'subclass'),
    ('subclass:historical_doc', 'subclass'),
    ('subclass:biographical_doc', 'subclass'),
    ('subclass:investigative_doc', 'subclass'),

    -- Subclasses for Drama
    ('subclass:historical_drama', 'subclass'),
    ('subclass:courtroom_drama', 'subclass'),
    ('subclass:family_drama', 'subclass'),
    ('subclass:biographical_drama', 'subclass'),

    -- Subclasses for Fantasy
    ('subclass:high_fantasy', 'subclass'),
    ('subclass:dark_fantasy', 'subclass'),
    ('subclass:urban_fantasy', 'subclass'),

    -- Subclasses for Horror
    ('subclass:supernatural_horror', 'subclass'),
    ('subclass:slasher', 'subclass'),
    ('subclass:cosmic_horror', 'subclass'),
    ('subclass:body_horror', 'subclass'),

    -- Subclasses for Mystery
    ('subclass:whodunit', 'subclass'),
    ('subclass:noir', 'subclass'),
    ('subclass:conspiracy_mystery', 'subclass'),

    -- Subclasses for Romance
    ('subclass:historical_romance', 'subclass'),
    ('subclass:contemporary_romance', 'subclass'),
    ('subclass:fantasy_romance', 'subclass'),

    -- Subclasses for Science Fiction
    ('subclass:space_opera', 'subclass'),
    ('subclass:cyberpunk', 'subclass'),
    ('subclass:time_travel', 'subclass'),
    ('subclass:dystopian', 'subclass'),

    -- Subclasses for Thriller
    ('subclass:psychological_thriller', 'subclass'),
    ('subclass:political_thriller', 'subclass'),
    ('subclass:techno_thriller', 'subclass'),

    -- Subclasses for Western
    ('subclass:spaghetti_western', 'subclass'),
    ('subclass:revisionist_western', 'subclass'),
    ('subclass:contemporary_western', 'subclass'),

    -- Object Types (4)
    ('object:feature_film', 'object'),
    ('object:documentary_feature', 'object'),
    ('object:animated_feature', 'object'),
    ('object:anthology_feature', 'object')
ON CONFLICT (metaid) DO UPDATE 
    SET entity_type = EXCLUDED.entity_type;

-- ------------------------------------------------------------------------------
-- 2. Seed Class Table
-- ------------------------------------------------------------------------------
INSERT INTO class (metaid, name, description) VALUES
    ('class:action', 'Action', 'Films characterized by physical challenges, stunts, chases, rescues, and battles.'),
    ('class:adventure', 'Adventure', 'Films driven by journeys, quests, exploration, exotic locations, and conquering hazards.'),
    ('class:animation', 'Animation', 'Motion pictures created through consecutive hand-drawn, stop-motion, or digital CGI frames.'),
    ('class:comedy', 'Comedy', 'Lighthearted narratives crafted to evoke laughter, humorous insight, and amusement.'),
    ('class:crime', 'Crime', 'Films revolving around criminal plots, law enforcement investigations, syndicates, and justice.'),
    ('class:documentary', 'Documentary', 'Non-fictional cinema recording real events, wildlife, cultural history, and investigative exposes.'),
    ('class:drama', 'Drama', 'Character-driven realistic stories portraying intense emotional journeys, conflict, and societal themes.'),
    ('class:fantasy', 'Fantasy', 'Mythic and magical narratives set in imaginary realms featuring supernatural lore.'),
    ('class:horror', 'Horror', 'Films designed to invoke dread, terror, suspense, psychological fright, and macabre fascination.'),
    ('class:mystery', 'Mystery', 'Narratives centering on the puzzle of unsolved crimes, hidden secrets, and investigative clues.'),
    ('class:romance', 'Romance', 'Stories revolving around love, passion, intimate relationships, and emotional vulnerability.'),
    ('class:sci_fi', 'Science Fiction', 'Speculative fiction exploring futuristic science, space exploration, artificial life, and technology.'),
    ('class:thriller', 'Thriller', 'High-tension narratives marked by suspense, imminent jeopardy, psychological traps, and climax.'),
    ('class:western', 'Western', 'Frontier epics set in the 19th and early 20th century American borderlands and rural wilderness.')
ON CONFLICT (metaid) DO UPDATE 
    SET name = EXCLUDED.name,
        description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 3. Seed Subclass Table
-- ------------------------------------------------------------------------------
INSERT INTO subclass (metaid, class_metaid, name, description) VALUES
    -- Action Subclasses
    ('subclass:martial_arts', 'class:action', 'Martial Arts', 'Focuses on unarmed combat, martial philosophy, and choreographed stunts.'),
    ('subclass:superhero', 'class:action', 'Superhero', 'Features costumed vigilantes with extraordinary superhuman powers or advanced technologies.'),
    ('subclass:action_thriller', 'class:action', 'Action Thriller', 'Combines high-stakes action sequences with relentless suspense and tension.'),
    ('subclass:military_action', 'class:action', 'Military Action', 'Depicts modern or historical military engagements, tactical units, and war combat.'),

    -- Adventure Subclasses
    ('subclass:swashbuckler', 'class:adventure', 'Swashbuckler', 'Heroic swordplay, seafaring piracy, daring rescues, and chivalry.'),
    ('subclass:treasure_hunt', 'class:adventure', 'Treasure Hunt', 'Archaeological quests and expeditions to recover hidden artifacts or lost riches.'),
    ('subclass:survival', 'class:adventure', 'Survival', 'Protagonists confronting unforgiving wilderness, shipwrecks, and extreme environmental elements.'),

    -- Animation Subclasses
    ('subclass:cgi_3d', 'class:animation', '3D CGI Animation', 'Full three-dimensional computer-rendered imagery with realistic textures and lighting.'),
    ('subclass:traditional_2d', 'class:animation', 'Traditional 2D Animation', 'Classic hand-drawn cel or 2D vector animation techniques.'),
    ('subclass:stop_motion', 'class:animation', 'Stop-Motion', 'Physical puppets, claymation, and articulated models captured frame by frame.'),
    ('subclass:anime', 'class:animation', 'Anime Feature', 'Japanese animation styling featuring distinct artistic grammar, emotive expression, and themes.'),

    -- Comedy Subclasses
    ('subclass:romantic_comedy', 'class:comedy', 'Romantic Comedy', 'Humorous depiction of romance, comedic misunderstandings, and courtship.'),
    ('subclass:satire', 'class:comedy', 'Satire & Parody', 'Mockery of political institutions, societal norms, and cultural hypocrisy.'),
    ('subclass:dark_comedy', 'class:comedy', 'Dark Comedy', 'Explores morbid, grotesque, or taboo topics through cynical humor and irony.'),
    ('subclass:slapstick', 'class:comedy', 'Slapstick & Physical', 'Exaggerated physical blunders, comical violence, and kinetic timing.'),

    -- Crime Subclasses
    ('subclass:detective', 'class:crime', 'Detective & Procedural', 'Methodical police investigations, forensic science, and detective deduction.'),
    ('subclass:gangster', 'class:crime', 'Gangster & Mob', 'Rise and fall of organized crime syndicates, mafia loyalty, and betrayal.'),
    ('subclass:heist', 'class:crime', 'Heist & Caper', 'Meticulous planning and execution of daring bank or vault robberies.'),
    ('subclass:true_crime', 'class:crime', 'True Crime Adaptation', 'Dramatization of factual criminal cases, trials, and historical investigations.'),

    -- Documentary Subclasses
    ('subclass:nature_wildlife', 'class:documentary', 'Nature & Wildlife', 'Cinematography of earth ecosystems, animal behavior, and natural biomes.'),
    ('subclass:historical_doc', 'class:documentary', 'Historical Chronicle', 'Archival footage, expert interviews, and factual reconstruction of history.'),
    ('subclass:biographical_doc', 'class:documentary', 'Biographical Profile', 'Intimate biographical portrait of influential thinkers, artists, or leaders.'),
    ('subclass:investigative_doc', 'class:documentary', 'Investigative Journalism', 'Deep-dive journalistic exposes unearthing corruption and corporate deceit.'),

    -- Drama Subclasses
    ('subclass:historical_drama', 'class:drama', 'Historical Period Drama', 'Authentic recreations of social mores and personal drama in historical eras.'),
    ('subclass:courtroom_drama', 'class:drama', 'Courtroom Drama', 'Legal proceedings, cross-examinations, and battles of justice before juries.'),
    ('subclass:family_drama', 'class:drama', 'Family & Domestic Drama', 'Intergenerational struggles, marital friction, and domestic emotional bonds.'),
    ('subclass:biographical_drama', 'class:drama', 'Biopic Drama', 'Dramatized cinematic life stories of notable real-world persons.'),

    -- Fantasy Subclasses
    ('subclass:high_fantasy', 'class:fantasy', 'High Epic Fantasy', 'Grand secondary world myths, kingdoms, legendary magical artifacts, and quests.'),
    ('subclass:dark_fantasy', 'class:fantasy', 'Dark Fantasy', 'Grim settings steeped in gothic horror, terrifying monsters, and dark magic.'),
    ('subclass:urban_fantasy', 'class:fantasy', 'Urban Fantasy', 'Supernatural beings and mythical elements secretly living within modern cities.'),

    -- Horror Subclasses
    ('subclass:supernatural_horror', 'class:horror', 'Supernatural Horror', 'Hauntings, demonic possessions, malicious poltergeists, and spectral curses.'),
    ('subclass:slasher', 'class:horror', 'Slasher', 'Masked or psychopathic stalkers hunting down a group of victims in isolated locales.'),
    ('subclass:cosmic_horror', 'class:horror', 'Cosmic & Eldritch', 'Incomprehensible ancient elder deities driving human observers to madness.'),
    ('subclass:body_horror', 'class:horror', 'Body Horror', 'Grotesque psychological and physiological mutations and flesh transformations.'),

    -- Mystery Subclasses
    ('subclass:whodunit', 'class:mystery', 'Whodunit', 'Locked-room mysteries, eccentric detectives, and assembling cryptic clues to identify the culprit.'),
    ('subclass:noir', 'class:mystery', 'Neo-Noir & Classic Noir', 'Shadowy cynicism, femme fatales, private eyes, and pervasive urban corruption.'),
    ('subclass:conspiracy_mystery', 'class:mystery', 'Conspiracy Mystery', 'Complex webs of institutional secrets, government cover-ups, and paranoia.'),

    -- Romance Subclasses
    ('subclass:historical_romance', 'class:romance', 'Period Romance', 'Passionate courtships constrained by historical decorum and social barriers.'),
    ('subclass:contemporary_romance', 'class:romance', 'Contemporary Romance', 'Modern love, career balancing, serendipity, and relationship intimacy.'),
    ('subclass:fantasy_romance', 'class:romance', 'Fantasy Romance', 'Love stories crossing supernatural realms, magical bonds, or immortal divides.'),

    -- Science Fiction Subclasses
    ('subclass:space_opera', 'class:sci_fi', 'Space Opera', 'Galactic empires, starship fleets, alien civilizations, and cosmic warfare.'),
    ('subclass:cyberpunk', 'class:sci_fi', 'Cyberpunk', 'High tech and low life: neural interfaces, megacorporate tyranny, and hackers.'),
    ('subclass:time_travel', 'class:sci_fi', 'Time Travel & Temporal', 'Paradoxes, butterfly effects, chrononavigation, and alternate timelines.'),
    ('subclass:dystopian', 'class:sci_fi', 'Dystopian & Post-Apocalyptic', 'Totalitarian regimes, environmental collapse, and ruined future societies.'),

    -- Thriller Subclasses
    ('subclass:psychological_thriller', 'class:thriller', 'Psychological Thriller', 'Mind games, gaslighting, unreliable narrators, and crumbling sanity.'),
    ('subclass:political_thriller', 'class:thriller', 'Political Thriller', 'Espionage, state power struggles, intelligence agencies, and assassination plots.'),
    ('subclass:techno_thriller', 'class:thriller', 'Techno-Thriller', 'Cyber warfare, rogue AI, automated defense systems, and digital extortion.'),

    -- Western Subclasses
    ('subclass:spaghetti_western', 'class:western', 'Spaghetti Western', 'Stylized, morally ambiguous frontier violence, operatic standoffs, and bounty hunters.'),
    ('subclass:revisionist_western', 'class:western', 'Revisionist Western', 'Subversion of traditional frontier myths, depicting the harsh, bleak historical reality.'),
    ('subclass:contemporary_western', 'class:western', 'Contemporary Neo-Western', 'Modern-day border crime, lawmen, and ranching conflicts in the American Southwest.')
ON CONFLICT (metaid) DO UPDATE 
    SET class_metaid = EXCLUDED.class_metaid,
        name = EXCLUDED.name,
        description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 3b. Seed relation_class_subclass Table
-- ------------------------------------------------------------------------------
-- Explicitly records how each class and subclass are related, with relationship
-- type and semantic explanation for each row.
-- ------------------------------------------------------------------------------
INSERT INTO relation_class_subclass (class_metaid, subclass_metaid, relation_type, description)
SELECT 
    sc.class_metaid,
    sc.metaid AS subclass_metaid,
    'thematic_specialization' AS relation_type,
    sc.name || ' is a specialized subgenre within the ' || c.name || ' class, focusing on: ' || sc.description AS description
FROM subclass sc
JOIN class c ON sc.class_metaid = c.metaid
ON CONFLICT (class_metaid, subclass_metaid) DO UPDATE
    SET relation_type = EXCLUDED.relation_type,
        description = EXCLUDED.description;

-- ------------------------------------------------------------------------------
-- 4. Seed Definition Table
-- ------------------------------------------------------------------------------

-- Populate semantic definitions for every class, subclass, and object type.
-- ------------------------------------------------------------------------------
INSERT INTO definition (metaid, name, entity_type, description, data_type, namespace, version) VALUES
    -- Object Metadata Definitions
    ('object:feature_film', 'Narrative Feature Film', 'object', 'Standard theatrical or streaming narrative feature film with a structured fictional storyline.', 'entity.film.feature', 'movies.objects', '1.0.0'),
    ('object:documentary_feature', 'Documentary Feature Film', 'object', 'Full-length non-fiction motion picture examining real-world individuals, events, or natural science.', 'entity.film.documentary', 'movies.objects', '1.0.0'),
    ('object:animated_feature', 'Animated Feature Film', 'object', 'Feature-length animated cinematic presentation utilizing computer or hand-drawn animation techniques.', 'entity.film.animation', 'movies.objects', '1.0.0'),
    ('object:anthology_feature', 'Anthology Feature Film', 'object', 'Composite feature film consisting of multiple distinct short story segments unified by a central theme.', 'entity.film.anthology', 'movies.objects', '1.0.0'),

    -- Class Metadata Definitions
    ('class:action', 'Action Movie Class', 'class', 'Top-level taxonomy for fast-paced physical conflict, stunt-driven, and kinetic cinema.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:adventure', 'Adventure Movie Class', 'class', 'Top-level taxonomy for journey, expedition, wilderness exploration, and quest cinema.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:animation', 'Animation Movie Class', 'class', 'Top-level taxonomy for motion picture projects generated via frame-by-frame synthesis.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:comedy', 'Comedy Movie Class', 'class', 'Top-level taxonomy for humor, satire, parody, and entertainment designed to amuse.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:crime', 'Crime Movie Class', 'class', 'Top-level taxonomy for criminal conspiracies, underworld syndicates, and police procedures.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:documentary', 'Documentary Movie Class', 'class', 'Top-level taxonomy for non-fictional educational, biographical, and investigative cinema.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:drama', 'Drama Movie Class', 'class', 'Top-level taxonomy for serious realistic emotional exploration of the human condition.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:fantasy', 'Fantasy Movie Class', 'class', 'Top-level taxonomy for imaginary universes, magic systems, and legendary mythological quests.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:horror', 'Horror Movie Class', 'class', 'Top-level taxonomy for terrifying, uncanny, visceral, and supernatural shock cinema.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:mystery', 'Mystery Movie Class', 'class', 'Top-level taxonomy for deductive logic, crime puzzles, and suspenseful investigations.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:romance', 'Romance Movie Class', 'class', 'Top-level taxonomy for passion, romantic intimacy, and courtship narratives.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:sci_fi', 'Science Fiction Movie Class', 'class', 'Top-level taxonomy for speculative future technologies, outer space, and cybernetics.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:thriller', 'Thriller Movie Class', 'class', 'Top-level taxonomy for intense suspense, peril, mind games, and ticking-clock tension.', 'taxonomy.class', 'movies.classes', '1.0.0'),
    ('class:western', 'Western Movie Class', 'class', 'Top-level taxonomy for frontier borderland history, outlaw codes, and rural showdowns.', 'taxonomy.class', 'movies.classes', '1.0.0'),

    -- Subclass Metadata Definitions (All 49)
    ('subclass:martial_arts', 'Martial Arts Subclass', 'subclass', 'Sub-genre focused on eastern and western fighting systems and acrobatic combat.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:superhero', 'Superhero Subclass', 'subclass', 'Sub-genre centered on extraordinary heroes combating supervillains.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:action_thriller', 'Action Thriller Subclass', 'subclass', 'Sub-genre mixing high-octane physical pursuits with intense plot suspense.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:military_action', 'Military Action Subclass', 'subclass', 'Sub-genre focused on tactical special forces and military warfare.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:swashbuckler', 'Swashbuckler Subclass', 'subclass', 'Sub-genre highlighting flamboyant swordplay, pirate ships, and romantic chivalry.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:treasure_hunt', 'Treasure Hunt Subclass', 'subclass', 'Sub-genre centered on deciphering ancient maps to unearth hidden relics.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:survival', 'Survival Subclass', 'subclass', 'Sub-genre focusing on solitary characters battling harsh nature and survival odds.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:cgi_3d', '3D CGI Animation Subclass', 'subclass', 'Sub-genre utilizing volumetric 3D software rendering for digital storytelling.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:traditional_2d', 'Traditional 2D Animation Subclass', 'subclass', 'Sub-genre using frame-by-frame 2D illustration and animation.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:stop_motion', 'Stop-Motion Subclass', 'subclass', 'Sub-genre using physical models photographed incrementally to simulate life.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:anime', 'Anime Feature Subclass', 'subclass', 'Sub-genre adhering to Japanese animation aesthetics, archetypes, and conventions.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:romantic_comedy', 'Romantic Comedy Subclass', 'subclass', 'Sub-genre blending humorous relationship blunders with romantic fulfillment.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:satire', 'Satire & Parody Subclass', 'subclass', 'Sub-genre utilizing wit and parody to expose ideological absurdities.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:dark_comedy', 'Dark Comedy Subclass', 'subclass', 'Sub-genre framing death, tragedy, and taboo with grim, biting humor.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:slapstick', 'Slapstick Subclass', 'subclass', 'Sub-genre relying on kinetic physical comedy, visual gags, and clumsy mishaps.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:detective', 'Detective Procedural Subclass', 'subclass', 'Sub-genre focused on police investigators solving homicide cases.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:gangster', 'Gangster Subclass', 'subclass', 'Sub-genre chronicling criminal empires, syndicates, and mob enforcers.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:heist', 'Heist Subclass', 'subclass', 'Sub-genre dramatizing complex infiltration and robbery plans.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:true_crime', 'True Crime Subclass', 'subclass', 'Sub-genre dramatizing real criminal investigations and courtroom verdicts.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:nature_wildlife', 'Nature Wildlife Subclass', 'subclass', 'Sub-genre documenting biological ecosystems, wildlife, and natural wonders.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:historical_doc', 'Historical Chronicle Subclass', 'subclass', 'Sub-genre investigating key moments in global history with primary archives.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:biographical_doc', 'Biographical Documentary Subclass', 'subclass', 'Sub-genre presenting the real life and legacy of historic figures.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:investigative_doc', 'Investigative Documentary Subclass', 'subclass', 'Sub-genre exposing institutional corruption and environmental malpractice.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:historical_drama', 'Historical Drama Subclass', 'subclass', 'Sub-genre exploring emotional human stakes set in authentic past epochs.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:courtroom_drama', 'Courtroom Drama Subclass', 'subclass', 'Sub-genre set in judicial courts focusing on lawyer arguments and justice.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:family_drama', 'Family Drama Subclass', 'subclass', 'Sub-genre examining kinship, family dynamics, inheritance, and grief.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:biographical_drama', 'Biopic Drama Subclass', 'subclass', 'Sub-genre dramatizing life achievements and tribulations of celebrated people.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:high_fantasy', 'High Fantasy Subclass', 'subclass', 'Sub-genre featuring secondary worlds, grand magical warfare, and mythical races.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:dark_fantasy', 'Dark Fantasy Subclass', 'subclass', 'Sub-genre weaving horror, dread, and monstrous magic into fantasy worlds.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:urban_fantasy', 'Urban Fantasy Subclass', 'subclass', 'Sub-genre introducing hidden mythological creatures into modern urban sprawl.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:supernatural_horror', 'Supernatural Horror Subclass', 'subclass', 'Sub-genre focused on poltergeists, demons, occult rituals, and hauntings.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:slasher', 'Slasher Subclass', 'subclass', 'Sub-genre depicting a ruthless serial killer stalking young victims.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:cosmic_horror', 'Cosmic Horror Subclass', 'subclass', 'Sub-genre confronting unimaginable godlike entities and cosmic insignificance.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:body_horror', 'Body Horror Subclass', 'subclass', 'Sub-genre depicting psychological horror through anatomical transformation.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:whodunit', 'Whodunit Subclass', 'subclass', 'Sub-genre inviting the audience to deduce the murderer among suspects.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:noir', 'Noir Subclass', 'subclass', 'Sub-genre marked by moral ambiguity, hardboiled detectives, and rain-slicked city streets.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:conspiracy_mystery', 'Conspiracy Mystery Subclass', 'subclass', 'Sub-genre following characters uncovering secretive government cabals.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:historical_romance', 'Historical Romance Subclass', 'subclass', 'Sub-genre exploring romantic passion through the lenses of historical customs.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:contemporary_romance', 'Contemporary Romance Subclass', 'subclass', 'Sub-genre centering on 21st-century dating, passion, and modern careers.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:fantasy_romance', 'Fantasy Romance Subclass', 'subclass', 'Sub-genre pairing romantic relationships with mystical and magical dimensions.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:space_opera', 'Space Opera Subclass', 'subclass', 'Sub-genre highlighting grand space battles, galactic diplomacy, and deep void exploration.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:cyberpunk', 'Cyberpunk Subclass', 'subclass', 'Sub-genre depicting neon-lit corporate dystopias, cyborgs, and netrunners.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:time_travel', 'Time Travel Subclass', 'subclass', 'Sub-genre exploring the philosophical and scientific consequences of temporal shifts.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:dystopian', 'Dystopian Subclass', 'subclass', 'Sub-genre depicting post-collapse societies ruled by totalitarian regimes.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:psychological_thriller', 'Psychological Thriller Subclass', 'subclass', 'Sub-genre probing the fragile psyche, deceit, paranoia, and memory loss.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:political_thriller', 'Political Thriller Subclass', 'subclass', 'Sub-genre exploring espionage, state surveillance, and political coups.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:techno_thriller', 'Techno-Thriller Subclass', 'subclass', 'Sub-genre focusing on cutting-edge military hardware, nuclear threats, and cyber attacks.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:spaghetti_western', 'Spaghetti Western Subclass', 'subclass', 'Sub-genre pioneered in Mediterranean cinema with gritty, operatic antiheroes.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:revisionist_western', 'Revisionist Western Subclass', 'subclass', 'Sub-genre demythologizing the American West with historical grit and tragedy.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0'),
    ('subclass:contemporary_western', 'Contemporary Western Subclass', 'subclass', 'Sub-genre applying western themes and moral codes to modern Southwest crime.', 'taxonomy.subclass', 'movies.subclasses', '1.0.0')
ON CONFLICT (metaid) DO UPDATE 
    SET name = EXCLUDED.name,
        entity_type = EXCLUDED.entity_type,
        description = EXCLUDED.description,
        data_type = EXCLUDED.data_type,
        namespace = EXCLUDED.namespace,
        version = EXCLUDED.version,
        updated_at = CURRENT_TIMESTAMP;

COMMIT;
