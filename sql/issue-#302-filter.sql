-- DROP TABLE "Broadcasters"

CREATE TABLE "Broadcasters"
(
  _id character varying(4),
  name character varying(128),
  fqdns character varying(128) Array,
  CONSTRAINT "Broadcasters_pkey" PRIMARY KEY ("_id")
)
WITH (
  OIDS=FALSE
);

-- PROD
INSERT INTO "Broadcasters"
       ("_id", "name", "fqdns")
VALUES
     ('WEB', 'WEB', '{"afrostream-backend.herokuapp.com"}'),
     ('MOBI', 'MOBILE', '{"legacy-api.afrostream.tv"}'),
     ('BMIA', 'BOUYGUES_MIAMI', '{"legacy-api-bouygues.afrostream.tv"}'),
     ('EBOU', 'EXPORTS_BOUYGUES', '{"afrostream-backend.herokuapp.com"}'),
     ('EOCI', 'EXPORTS_OCI', '{"afrostream-backend.herokuapp.com"}'),
     ('EOSE', 'EXPORTS_OSEARCH', '{"afrostream-backend.herokuapp.com"}'),
     ('ONEW', 'ORANGE_NEWBOX', '{"legacy-api-orange.afrostream.tv"}'),
     ('OMIB', 'ORANGE_MIB4', '{"legacy-api-orange.afrostream.tv"}'),
     ('ROKU', 'ROKU', '{"afrostream-backend.herokuapp.com"}');  -- fixme: should have it's own domain.

-- STAGING
INSERT INTO "Broadcasters"
       ("_id", "name", "fqdns")
VALUES
     ('WEB', 'WEB', '{"afr-back-end-staging.herokuapp.com"}'),
     ('MOBI', 'MOBILE', '{"legacy-api-staging.afrostream.tv"}'),
     ('BMIA', 'BOUYGUES_MIAMI', '{"legacy-api-bouygues-staging.afrostream.tv"}'),
     ('EBOU', 'EXPORTS_BOUYGUES', '{"afr-back-end-staging.herokuapp.com"}'),
     ('EOCI', 'EXPORTS_OCI', '{"afr-back-end-staging.herokuapp.com"}'),
     ('EOSE', 'EXPORTS_OSEARCH', '{"afr-back-end-staging.herokuapp.com"}'),
     ('ONEW', 'ORANGE_NEWBOX', '{"legacy-api-orange-staging.afrostream.tv"}'),
     ('OMIB', 'ORANGE_MIB4', '{"legacy-api-orange-staging.afrostream.tv"}'),
     ('ROKU', 'ROKU', '{"afr-back-end-staging.herokuapp.com"}');

-- DEV
INSERT INTO "Broadcasters"
       ("_id", "name", "fqdns")
VALUES
     ('WEB', 'WEB', '{"localhost"}'),
     ('MOBI', 'MOBILE', '{"localhost"}'),
     ('BMIA', 'BOUYGUES_MIAMI', '{"localhost"}'),
     ('EBOU', 'EXPORTS_BOUYGUES', '{"localhost"}'),
     ('EOCI', 'EXPORTS_OCI', '{"localhost"}'),
     ('EOSE', 'EXPORTS_OSEARCH', '{"localhost"}'),
     ('ONEW', 'ORANGE_NEWBOX', '{"localhost"}'),
     ('OMIB', 'ORANGE_MIB4', '{"localhost"}'),
     ('ROKU', 'ROKU', '{"localhost"}');

-- DROP TABLE "BroadcastersClients"
--CREATE TABLE "BroadcastersClients"
--(
--  _id serial NOT NULL,
--  "broadcasterId" character varying(4), -- Broadcasters._id
--  "clientId" uuid NOT NULL,             -- Clients._id
--  CONSTRAINT "BroadcastersClients_pkey" PRIMARY KEY ("broadcasterId", "clientId"),
--  CONSTRAINT "BroadcastersClients_BroadcasterId_fkey" FOREIGN KEY ("broadcasterId")
--      REFERENCES "Broadcasters" (_id) MATCH SIMPLE
--      ON UPDATE CASCADE ON DELETE CASCADE,
--  CONSTRAINT "BroadcastersClients_ClientId_fkey" FOREIGN KEY ("clientId")
--      REFERENCES "Clients" (_id) MATCH SIMPLE
--      ON UPDATE CASCADE ON DELETE CASCADE
--)
--WITH (
--  OIDS=FALSE
--);

-- PROD
--INSERT INTO "BroadcastersClients"
--       ("broadcasterId", "clientId")
--SELECT "Broadcasters"._id, "Clients"."_id" from "Broadcasters"
--  inner join "Clients" on
--      "Broadcasters"."name" = 'MOBILE' AND "Clients".type = 'legacy-api.tapptic' OR
--      "Broadcasters"."name" = 'WEB' AND "Clients".type = 'front-api.front-end' OR
--      "Broadcasters"."name" = 'BOUYGUES' AND "Clients".type = 'legacy-api.bouygues-miami' OR
--      "Broadcasters"."name" = 'EXPORTS_BOUYGUES' AND "Clients".type = 'afrostream-exports-bouygues' OR
--      "Broadcasters"."name" = 'EXPORTS_OCI' AND "Clients".type = 'afrostream-exports-oci' OR
--      "Broadcasters"."name" = 'EXPORTS_OSEARCH' AND "Clients".type = 'afrostream-exports-osearch' OR
--      "Broadcasters"."name" = 'ORANGE_MIB4' AND "Clients".type = 'legacy-api.orange' OR
--      "Broadcasters"."name" = 'ORANGE_NEWBOX' AND "Clients".type = 'legacy-api.orange-newbox' OR
--      "Broadcasters"."name" = 'ROKU' AND "Clients".type = 'legacy-api.roku';

--
ALTER TABLE "Categories" ADD COLUMN "countries" character varying(2) ARRAY;
ALTER TABLE "Categories" ADD COLUMN "broadcasters" integer ARRAY;
ALTER TABLE "Movies" ADD COLUMN "countries" character varying(2) ARRAY;
ALTER TABLE "Movies" ADD COLUMN "broadcasters" integer ARRAY;
ALTER TABLE "Seasons" ADD COLUMN "countries" character varying(2) ARRAY;
ALTER TABLE "Seasons" ADD COLUMN "broadcasters" integer ARRAY;
ALTER TABLE "Episodes" ADD COLUMN "countries" character varying(2) ARRAY;
ALTER TABLE "Episodes" ADD COLUMN "broadcasters" integer ARRAY;
ALTER TABLE "Videos" ADD COLUMN "countries" character varying(2) ARRAY;
ALTER TABLE "Videos" ADD COLUMN "broadcasters" integer ARRAY;


-- 19/09/2016
DROP TABLE "BroadcastersClients";
DROP TABLE "Broadcasters";

  -- + recréer les tables

ALTER TABLE "Categories" DROP COLUMN broadcasters;
ALTER TABLE "Movies" DROP COLUMN broadcasters;
ALTER TABLE "Seasons" DROP COLUMN broadcasters;
ALTER TABLE "Episodes" DROP COLUMN broadcasters;
ALTER TABLE "Videos" DROP COLUMN broadcasters;

ALTER TABLE "Categories" ADD COLUMN "broadcasters" character varying(4) ARRAY;
ALTER TABLE "Movies" ADD COLUMN "broadcasters" character varying(4) ARRAY;
ALTER TABLE "Seasons" ADD COLUMN "broadcasters" character varying(4) ARRAY;
ALTER TABLE "Episodes" ADD COLUMN "broadcasters" character varying(4) ARRAY;
ALTER TABLE "Videos" ADD COLUMN "broadcasters" character varying(4) ARRAY;

-- 22/08/2016 : 1 client => 1 broadcaster
ALTER TABLE "Clients" ADD COLUMN "broadcasterId" character varying(4);

DROP TABLE "BroadcastersClients";
DROP TABLE "Broadcasters";
-- on ne recrée que la table Broadcasters

UPDATE "Clients" SET ("broadcasterId" = "Broadcasters"."_id")
FROM "Broadcasters"
WHERE
("Clients".type = 'front-api.front-end' AND "Broadcasters".name = 'WEB') OR
("Clients".type = 'legacy-api.roku' AND "Broadcasters".name = 'ROKU') OR
("Clients".type = 'legacy-api.tapptic' AND "Broadcasters".name = 'MOBILE') OR
("Clients".type = 'legacy-api.bouygues-miami' AND "Broadcasters".name = 'BOUYGUES_MIAMI') OR
("Clients".type = 'afrostream-exports-osearch' AND "Broadcasters".name = 'EXPORTS_OSEARCH') OR
("Clients".type = 'afrostream-exports-bouygues' AND "Broadcasters".name = 'EXPORTS_BOUYGUES') OR
("Clients".type = 'afrostream-exports-oci' AND "Broadcasters".name = 'EXPORTS_OCI') OR
("Clients".type = 'legacy-api.orange-newbox' AND "Broadcasters".name = 'ORANGE_NEWBOX') OR
("Clients".type = 'legacy-api.orange' AND "Broadcasters".name = 'ORANGE_MIB4')
