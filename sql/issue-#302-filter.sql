-- DROP TABLE "Broadcasters"

CREATE TABLE "Broadcasters"
(
  _id serial NOT NULL,
  name character varying(128),
  fqdns character varying(128) Array,
  CONSTRAINT "Broadcasters_pkey" PRIMARY KEY ("_id")
)
WITH (
  OIDS=FALSE
);

-- PROD
INSERT INTO "Broadcasters"
       ("name", "fqdns")
VALUES
     ('AFROSTREAM_MOBILE', '{"legacy-api.afrostream.tv"}'),
     ('AFROSTREAM_WEB', '{"afrostream-backend.herokuapp.com"}'),
     ('BOUYGUES', '{"legacy-api-bouygues.afrostream.tv"}'),
     ('EXPORTS_BOUYGUES', '{"afrostream-backend.herokuapp.com"}'),
     ('EXPORTS_OSEARCH', '{"afrostream-backend.herokuapp.com"}'),
     ('ORANGE', '{"legacy-api-orange.afrostream.tv"}'),
     ('ORANGE_CI', '{"afrostream-backend.herokuapp.com"}'),
     ('ROKU', '{"afrostream-backend.herokuapp.com"}');  -- fixme: should have it's own domain.

-- STAGING
INSERT INTO "Broadcasters"
       ("name", "fqdns")
VALUES
     ('AFROSTREAM_MOBILE', '{"legacy-api-staging.afrostream.tv"}'),
     ('AFROSTREAM_WEB', '{"afr-back-end-staging.herokuapp.com"}'),
     ('BOUYGUES', '{"legacy-api-bouygues-staging.afrostream.tv"}'),
     ('EXPORTS_BOUYGUES', '{"afr-back-end-staging.herokuapp.com"}'),
     ('EXPORTS_OSEARCH', '{"afr-back-end-staging.herokuapp.com"}'),
     ('ORANGE', '{"legacy-api-orange-staging.afrostream.tv"}'),
     ('ORANGE_CI', '{"afr-back-end-staging.herokuapp.com"}'),
     ('ROKU', '{"afr-back-end-staging.herokuapp.com"}');

-- DEV
INSERT INTO "Broadcasters"
       ("name", "fqdns")
VALUES
     ('AFROSTREAM_MOBILE', '{"localhost"}'),
     ('AFROSTREAM_WEB', '{"localhost"}'),
     ('BOUYGUES', '{"localhost"}'),
     ('EXPORTS_BOUYGUES', '{"localhost"}'),
     ('EXPORTS_OCI', '{"localhost"}'),
     ('EXPORTS_OSEARCH', '{"localhost"}'),
     ('ORANGE', '{"localhost"}'),
     ('ROKU', '{"localhost"}');

-- DROP TABLE "BroadcasterClients"
CREATE TABLE "BroadcasterClients"
(
  _id serial NOT NULL,
  "broadcasterId" integer NOT NULL, -- Broadcasters._id
  "clientId" uuid NOT NULL,  -- Clients._id
  CONSTRAINT "BroadcasterClients_pkey" PRIMARY KEY ("broadcasterId", "clientId"),
  CONSTRAINT "BroadcasterClients_BroadcasterId_fkey" FOREIGN KEY ("broadcasterId")
      REFERENCES "Broadcasters" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "BroadcasterClients_ClientId_fkey" FOREIGN KEY ("clientId")
      REFERENCES "Clients" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);

-- PROD
INSERT INTO "BroadcasterClients"
       ("broadcasterId", "clientId")
SELECT "Broadcasters"._id, "Clients"."_id" from "Broadcasters"
  inner join "Clients" on
      "Broadcasters"."name" = 'AFROSTREAM_MOBILE' AND "Clients".type = 'legacy-api.tapptic' OR
      "Broadcasters"."name" = 'AFROSTREAM_WEB' AND "Clients".type = 'front-api.front-end' OR
      "Broadcasters"."name" = 'BOUYGUES' AND "Clients".type = 'legacy-api.bouygues-miami' OR
      "Broadcasters"."name" = 'EXPORTS_BOUYGUES' AND "Clients".type = 'afrostream-exports-bouygues' OR
      "Broadcasters"."name" = 'EXPORTS_OCI' AND "Clients".type = 'afrostream-exports-oci' OR
      "Broadcasters"."name" = 'EXPORTS_OSEARCH' AND "Clients".type = 'afrostream-exports-osearch' OR
      "Broadcasters"."name" = 'ORANGE' AND "Clients".type = 'legacy-api.orange' OR
      "Broadcasters"."name" = 'ORANGE' AND "Clients".type = 'legacy-api.orange-newbox' OR
      "Broadcasters"."name" = 'ROKU' AND "Clients".type = 'legacy-api.roku';

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
