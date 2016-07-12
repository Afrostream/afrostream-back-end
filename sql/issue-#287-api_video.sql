-- groups
CREATE TABLE "PFGroups"
(
  _id serial NOT NULL,
  "name" character varying(64),
  CONSTRAINT "PFGroups_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

INSERT INTO "PFGroups"
  ("_id", "name")
VALUES
  (1, 'USP'),
  (2, 'BOUYGUES_INGRID'),
  (3, 'BOUYGUES_MIAMI'),
  (4, 'ORANGE'),
  (5, 'ORANGE_COTE_IVOIRE');

--
CREATE TABLE "PFProfiles"
(
  _id serial NOT NULL, -- backend side id
  "pfId" integer, -- pf side id (hope it will remain the same..)
  "name" character varying(64),
  "burnedCaptions" boolean,
  CONSTRAINT "PFProfiles_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

INSERT INTO "PFProfiles"
  ("_id", "pfId", "name", "burnedCaptions")
VALUES
  (1, 1, 'VIDEO0ENG_AUDIO0ENG_SUB0FRA_BOUYGUES', true),
  (2, 2, 'VIDEO0ENG_AUDIO0FRA_USP', false),
  (3, 3, 'VIDEO0ENG_AUDIO0FRA_BOUYGUES', false),
  (4, 4, 'VIDEO0ENG_AUDIO0FRA_AUDIO1ENG_BOUYGUES', false),
  (5, 5, 'VIDEO0ENG_AUDIO0FRA_AUDIO2ENG_USP', false),
  (6, 6, 'VIDEO0ENG_AUDIO0FRA_AUDIO1ENG_USP', false),
  (7, 7, 'VIDEO0ENG_AUDIO0ENG_USP', false),
  (8, 8, 'VIDEO_AUDIO_EXTRACT', false),
  (9, 9, 'VIDEO0ENG_AUDIO0FRA_AUDIO2ENG_BOUYGUES', false),
  (10, 10, 'VIDEO0ENG_AUDIO0ENG_SUB0FRA_ORANGE', true),
  (11, 11, 'VIDEO0ENG_AUDIO0FRA_ORANGE_COTE_IVOIRE', false),
  (12, 12, 'VIDEO0ENG_AUDIO0ENG_SUB0FRA_ORANGE_COTE_IVOIRE', false),
  (13, 13, 'VIDEO0ENG_AUDIO0FRA_AUDIO1ENG_ORANGE_COTE_IVOIRE', false),
  (14, 14, 'VIDEO0ENG_AUDIO0FRA_AUDIO2ENG_ORANGE_COTE_IVOIRE', false),
  (15, 15, 'VIDEO0ENG_AUDIO0FRA_BOUYGUES_MIAMI', false),
  (16, 16, 'VIDEO0ENG_AUDIO0ENG_BOUYGUES_MIAMI', false),
  (17, 17, 'VIDEO0ENG_AUDIO0FRA_AUDIO1ENG_BOUYGUES_MIAMI', false),
  (18, 18, 'VIDEO0ENG_AUDIO0FRA_AUDIO2ENG_BOUYGUES_MIAMI', false),
  (19, 19, 'VIDEO0ENG_AUDIO0FRA_ORANGE', false),
  (20, 20, 'VIDEO0ENG_AUDIO0FRA_AUDIO1ENG_ORANGE', false),
  (21, 21, 'VIDEO0ENG_AUDIO0FRA_AUDIO2ENG_ORANGE', false);

-- associe un groupe a des profiles
CREATE TABLE "PFGroupsProfiles"
(
  _id serial NOT NULL,
  "pfGroupId" integer,
  "pfProfileId" integer, -- backend id
  CONSTRAINT "PFGroupsProfiles_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

INSERT INTO "PFGroupsProfiles"
  ("pfGroupId", "pfProfileId")
VALUES
  (1, 2),
  (1, 5),
  (1, 6),
  (1, 7),

  (2, 1),
  (2, 3),
  (2, 4),
  (2, 9),

  (3, 15),
  (3, 16),
  (3, 17),
  (3, 18),

  (4, 10),
  (4, 19),
  (4, 20),
  (4, 21),

  (5, 11),
  (5, 12),
  (5, 13),
  (5, 14);

-- lien entre un client et un groupe
ALTER TABLE "Clients" ADD COLUMN "pfGroupId" integer;

UPDATE "Clients" SET "pfGroupId" = 1 WHERE "type" = 'front-api.front-end'; -- USP
UPDATE "Clients" SET "pfGroupId" = 1 WHERE "type" = 'legacy-api.tapptic'; -- USP
UPDATE "Clients" SET "pfGroupId" = 1 WHERE "type" = 'legacy-api.roku'; -- USP
UPDATE "Clients" SET "pfGroupId" = 3 WHERE "type" = 'legacy-api.bouygues-miami';
UPDATE "Clients" SET "pfGroupId" = 2 WHERE "type" = 'afrostream-exports-bouygues';
UPDATE "Clients" SET "pfGroupId" = 1 WHERE "type" = 'afrostream-exports-osearch'; -- USP ?
UPDATE "Clients" SET "pfGroupId" = 4 WHERE "type" = 'legacy-api.orange';  -- orange mib4
UPDATE "Clients" SET "pfGroupId" = 5 WHERE "type" = 'afrostream-exports-oci'; -- orange cote ivoire
UPDATE "Clients" SET "pfGroupId" = 4 WHERE "type" = 'legacy-api.orange-newbox'; -- orange newbox
