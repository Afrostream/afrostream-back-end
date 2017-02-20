-- DROP ALL
DROP TABLE IF EXISTS "Tenants";
DROP TABLE IF EXISTS "Items";
DROP TABLE IF EXISTS "ElementsVideos";
DROP TABLE IF EXISTS "ElementsPersons";
DROP TABLE IF EXISTS "ElementsSeries";
DROP TABLE IF EXISTS "ElementsSeasons";
DROP TABLE IF EXISTS "AssoItemsPersons";

-- creating a multi tentant database
DROP TABLE IF EXISTS "Tenants";
CREATE TABLE "Tenants"
(
  _id serial NOT NULL,
  "internalName" character varying(32), -- readable tenant name used by code (cannot be modified)
  name character varying(64),           -- tenant named displayed in GUI  (can be modified)
  CONSTRAINT "Tenants_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

INSERT INTO "Tenants" ("_id", "internalName", "name") VALUES (1, 'afrostream', 'Afrostream');

DROP TABLE IF EXISTS "Items";
CREATE TABLE "Items"
(
  -- champs techniques (ORM & PK)
  _id serial NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "deleted" boolean default false,
  -- champ relatif a l'item, pour le distinguer le type d'element
  "type" character varying(32) not null,
  -- filtrage marque blanche
  "tenantId" integer,
  -- champs de compatibilité ascendante
  "oldId" integer,
  "oldUuid" uuid,
  "oldType" character varying(32) not null,
  -- champs partagés
  title character varying(255) not null,
  description text,
  translations jsonb,
  "catchupProviderId" integer, -- pour des raisons de simplicité ...
  -- champs partagés tech
  slug character varying(255),
  -- champs partagés de filtrage
  active boolean default false,
  "dateFrom" timestamp with time zone,
  "dateTo" timestamp with time zone,
  countries character varying(2)[],
  broadcasters character varying(4)[],
  CONSTRAINT "Items_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);


--
-- VIDEOS
--
DROP TABLE IF EXISTS "ElementsVideos";
CREATE TABLE "ElementsVideos"
(
  -- champs techniques (ORM & PK)
  _id integer NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "deleted" boolean default false,
  -- type
  "type" character varying(16) not null, -- live, film, episode
  live boolean DEFAULT false,
  "episodeNumber" integer,
  "seasonId" integer,
  --
  duration numeric,
  drm boolean DEFAULT false,
  -- content data
  "imdbId" character varying(255),
  "productionCountry" character varying(64),
  "CSA" integer,
  "dateReleased" timestamp with time zone,
  "yearReleased" integer,
  "licensorId" integer,
  genre character varying(255),
  schedule character varying(255),
  -- custom
  "youtubeTrailer" character varying(255),
  -- cached / precomputed data
  rating numeric DEFAULT 3,
  -- PF: fixme: should be replaced by pfUuid & pfType
  "importId" integer,
  "encodingId" character varying(36),
  "pfMd5Hash" character varying(255),
  "sourceMp4" character varying(2048),
  CONSTRAINT "ElementsVideos_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

-- on merge Movies,Episodes,Videos dans NewVideos
-- Movies -> NewVideos
INSERT INTO "Items" (
  "createdAt", "updatedAt", "deleted", "type", "tenantId",
  "oldId", "oldUuid", "oldType",
  "title", "description", "translations", "catchupProviderId",
  "slug", "active", "dateFrom", "dateTo", "countries", "broadcasters"
)
SELECT
  "Movies"."createdAt", "Movies"."updatedAt", false as "deleted", 'video' as "type", 1 as "tenantId",
  "Movies"."_id" as "oldId", "Videos"."_id" as "oldUuid", 'movie' as "oldType",
  "Movies"."title", "Movies"."synopsis" as "description", "Movies"."translations", "Movies"."catchupProviderId",
  "Movies"."slug", "Movies"."active", "Movies"."dateFrom", "Movies"."dateTo", "Movies"."countries", "Movies"."broadcasters"
FROM
  "Movies"
INNER JOIN "Videos" ON "Movies"."videoId" = "Videos"."_id"
WHERE
  "Movies"."type"='movie';

INSERT INTO "ElementsVideos" (
  "_id", "createdAt", "updatedAt", "deleted",
  "type", "live", "duration", "drm", "imdbId", "productionCountry", "CSA",
  "dateReleased", "yearReleased", "licensorId", "genre", "schedule",
  "youtubeTrailer", "episodeNumber", "seasonId", "rating", "importId",
  "encodingId", "pfMd5Hash", "sourceMp4"
)
SELECT
  "Items"."_id" as "_id",
  "Movies"."createdAt" as "createdAt",
  "Movies"."updatedAt" as "updatedAt",
  false as "deleted",
  CASE WHEN "Movies".live = true THEN 'live' ELSE 'film' END as "type",
  "Movies".live as "live",
  "Videos".duration as "duration",
  "Videos".drm as "drm",
  "Movies"."imdbId" as "imdbId",
  "Movies"."productionCountry" as "productionCountry",
  "Movies"."CSA" as "CSA",
  "Movies"."dateReleased" as "dateReleased",
  "Movies"."yearReleased" as "yearReleased",
  "Movies"."licensorId" as "licensorId",
  "Movies"."genre" as "genre",
  "Movies"."schedule" as "schedule",
  "Movies"."youtubeTrailer" as "youtubeTrailer",
  null as "episodeNumber",
  null as "seasonId",
  "Movies"."rating" as "rating",
  "Videos"."importId" as "importId",
  "Videos"."encodingId" as "encodingId",
  "Videos"."pfMd5Hash" as "pfMd5Hash",
  "Videos"."sourceMp4" as "sourceMp4"
FROM
  "Movies"
INNER JOIN "Videos" ON "Movies"."videoId" = "Videos"."_id"
INNER JOIN "Items" ON "Items"."oldId" = "Movies"."_id" and "Items"."oldType" = 'movie'
WHERE
  "Movies"."type"='movie';

-- Episodes -> NewVideos
INSERT INTO "Items" (
  "createdAt", "updatedAt", "deleted", "type", "tenantId",
  "oldId", "oldUuid", "oldType",
  "title", "description", "translations", "catchupProviderId",
  "slug", "active", "dateFrom", "dateTo", "countries", "broadcasters"
)
SELECT
  "Episodes"."createdAt", "Episodes"."updatedAt", false as "deleted", 'video' as "type", 1 as "tenantId",
  "Episodes"."_id" as "oldId", "Videos"."_id" as "oldUuid", 'episode' as "oldType",
  "Episodes"."title", "Episodes"."synopsis" as "description", "Episodes"."translations", "Episodes"."catchupProviderId",
  "Episodes"."slug", "Episodes"."active", "Episodes"."dateFrom", "Episodes"."dateTo", "Episodes"."countries", "Episodes"."broadcasters"
FROM
  "Episodes"
INNER JOIN "Seasons" ON "Seasons"."_id" = "Episodes"."seasonId"
INNER JOIN "Movies" ON "Movies"."_id" = "Seasons"."movieId"
INNER JOIN "Videos" ON "Episodes"."videoId" = "Videos"."_id";

INSERT INTO "ElementsVideos" (
  "_id", "createdAt", "updatedAt", "deleted",
  "type", "live", "duration", "drm", "imdbId", "productionCountry", "CSA",
  "dateReleased", "yearReleased", "licensorId", "genre", "schedule",
  "youtubeTrailer", "episodeNumber", "seasonId", "rating", "importId",
  "encodingId", "pfMd5Hash", "sourceMp4"
)
SELECT
  "Items"."_id" as "_id",
  "Episodes"."createdAt" as "createdAt",
  "Episodes"."updatedAt" as "updatedAt",
  false as "deleted",
  'episode' as "type",
  "Movies".live as "live",
  "Videos".duration as "duration",
  "Videos".drm as "drm",
  "Episodes"."imdbId" as "imdbId",
  null as "productionCountry",
  "Episodes"."CSA" as "CSA",
  "Movies"."dateReleased" as "dateReleased",
  "Movies"."yearReleased" as "yearReleased",
  "Movies"."licensorId" as "licensorId", -- FIXME ?
  "Movies"."genre" as "genre",
  null as "schedule",
  null as "youtubeTrailer",
  "Episodes"."episodeNumber" as "episodeNumber",
  "Episodes"."seasonId" as "seasonId",
  "Episodes"."rating" as "rating",
  "Videos"."importId" as "importId",
  "Videos"."encodingId" as "encodingId",
  "Videos"."pfMd5Hash" as "pfMd5Hash",
  "Videos"."sourceMp4" as "sourceMp4"
FROM
  "Episodes"
INNER JOIN "Seasons" ON "Seasons"."_id" = "Episodes"."seasonId"
INNER JOIN "Movies" ON "Movies"."_id" = "Seasons"."movieId"
INNER JOIN "Videos" ON "Episodes"."videoId" = "Videos"."_id"
INNER JOIN "Items" ON "Items"."oldId" = "Episodes"."_id" and "Items"."oldType" = 'episode';

--
-- SERIES
--
-- Movies => Series
DROP TABLE IF EXISTS "ElementsSeries";
CREATE TABLE "ElementsSeries"
(
  _id integer not null,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "deleted" boolean default false,
  "numberOfSeasons" integer,
  -- FIXME: redondant avec les infos de chaque épisode ?
  "imdbId" character varying(255),
  "productionCountry" character varying(64),
  "CSA" integer,
  "dateReleased" timestamp with time zone,
  "yearReleased" integer,
  "licensorId" integer,
  genre character varying(255),
  schedule character varying(255),
  -- cached / precomputed data
  rating numeric DEFAULT 3,
  CONSTRAINT "ElementsSeries_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

-- data des séries
INSERT INTO "Items" (
  "createdAt", "updatedAt", "deleted", "type", "tenantId",
  "oldId", "oldUuid", "oldType",
  "title", "description", "translations", "catchupProviderId",
  "slug", "active", "dateFrom", "dateTo", "countries", "broadcasters"
)
SELECT
  "Movies"."createdAt", "Movies"."updatedAt", false as "deleted", 'video' as "type", 1 as "tenantId",
  "Movies"."_id" as "oldId", null as "oldUuid", 'serie' as "oldType",
  "Movies"."title", "Movies"."synopsis" as "description", "Movies"."translations", "Movies"."catchupProviderId",
  "Movies"."slug", "Movies"."active", "Movies"."dateFrom", "Movies"."dateTo", "Movies"."countries", "Movies"."broadcasters"
FROM
  "Movies"
WHERE
  "Movies"."type"='serie';

INSERT INTO "ElementsSeries" (
  "_id", "createdAt", "updatedAt", "deleted",
  "numberOfSeasons", "imdbId", "productionCountry", "CSA",
  "dateReleased", "yearReleased", "licensorId",
  genre, schedule, rating
)
SELECT
  "Items"."_id" as "_id",
  "Movies"."createdAt" as "createdAt",
  "Movies"."updatedAt" as "updatedAt",
  false as "deleted",
  null as "numberOfSeasons", -- fixme
  "Movies"."imdbId" as "imdbId",
  "Movies"."productionCountry" as "productionCountry",
  "Movies"."CSA" as "CSA",
  "Movies"."dateReleased" as "dateReleased",
  "Movies"."yearReleased" as "yearReleased",
  "Movies"."licensorId" as "licensorId",
  "Movies"."genre" as "genre",
  "Movies"."schedule" as "schedule",
  "Movies"."rating" as "rating"
FROM
  "Movies"
INNER JOIN "Items" ON "Items"."oldId" = "Movies"."_id" and "Items"."oldType" = 'serie'
WHERE
  "Movies"."type"='serie';


--
-- SEASONS
--
DROP TABLE IF EXISTS "ElementsSeasons";
CREATE TABLE "ElementsSeasons"
(
  _id integer not null,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "deleted" boolean default false,
  --
  "numberOfEpisodes" integer,
  "serieId" integer,
  CONSTRAINT "ElementsSeasons_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

INSERT INTO "Items" (
  "createdAt", "updatedAt", "deleted", "type", "tenantId",
  "oldId", "oldUuid", "oldType",
  "title", "description", "translations", "catchupProviderId",
  "slug", "active", "dateFrom", "dateTo", "countries", "broadcasters"
)
SELECT
  "Seasons"."createdAt", "Seasons"."updatedAt", false as "deleted", 'season' as "type", 1 as "tenantId",
  "Seasons"."_id" as "oldId", null as "oldUuid", 'season' as "oldType",
  "Seasons"."title", "Seasons"."synopsis" as "description", "Seasons"."translations", "Seasons"."catchupProviderId",
  "Seasons"."slug", "Seasons"."active", "Seasons"."dateFrom", "Seasons"."dateTo", "Seasons"."countries", "Seasons"."broadcasters"
FROM
  "Seasons"
INNER JOIN "Items" as "ItemSerie" ON "ItemSerie"."oldId" = "Seasons"."movieId" and "ItemSerie"."oldType" = 'serie'
WHERE
  "Seasons"."movieId" is not null;

INSERT INTO "ElementsSeasons" (
  "_id", "createdAt", "updatedAt", "deleted",
  "numberOfEpisodes", "serieId"
)
SELECT
  "ItemSeason"."_id",
  "Seasons"."createdAt", "Seasons"."updatedAt", false as "deleted",
  "Seasons"."numberOfEpisodes", "ItemSerie"."_id" as "serieId"
FROM
  "Seasons"
INNER JOIN "Items" as "ItemSeason" ON "ItemSeason"."oldId" = "Seasons"."_id" and "ItemSeason"."oldType" = 'season'
INNER JOIN "Items" as "ItemSerie" ON "ItemSerie"."oldId" = "Seasons"."movieId" and "ItemSerie"."oldType" = 'serie'
;

--
-- CATEGORY
--
DROP TABLE IF EXISTS "ElementsCategories";
CREATE TABLE "ElementsCategories"
(
  _id serial not null,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "deleted" boolean default false,
  CONSTRAINT "ElementsCategories_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

INSERT INTO "Items" (
  "createdAt", "updatedAt", "deleted", "type", "tenantId",
  "oldId", "oldUuid", "oldType",
  "title", "description", "translations", "catchupProviderId",
  "slug", "active", "dateFrom", "dateTo", "countries", "broadcasters"
)
SELECT
  "Categories"."createdAt", "Categories"."updatedAt", false as "deleted", 'category' as "type", 1 as "tenantId",
  "Categories"."_id" as "oldId", null as "oldUuid", 'category' as "oldType",
  "Categories"."label" as "title", null as "description", "Categories"."translations", null as"catchupProviderId",
  "Categories"."slug", "Categories"."active", null as "dateFrom", null as "dateTo", "Categories"."countries", "Categories"."broadcasters"
FROM
  "Categories";

INSERT INTO "ElementsCategories" (
  "_id", "createdAt", "updatedAt", "deleted"
)
SELECT
  "ItemsCategories"."_id",
  "Categories"."createdAt", "Categories"."updatedAt", false as "deleted"
FROM
  "Categories"
INNER JOIN "Items" as "ItemsCategories" ON "ItemsCategories"."oldId" = "Categories"."_id" and "ItemsCategories"."oldType" = 'category'
;

--
-- Asso Item <-> Category
--
DROP TABLE IF EXISTS "AssoItemsCategories";
CREATE TABLE "AssoItemsCategories"
(
  _id serial not null,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "deleted" boolean default false,
  "itemId" integer not null,
  "categoryId" integer not null,
  "order" integer default null,
  CONSTRAINT "AssoItemsCategories_pkey" PRIMARY KEY (_id),
  CONSTRAINT "AssoItemsCategories_itemId_categoryId_key" UNIQUE ("itemId", "categoryId")
)
WITH (
  OIDS=FALSE
);

--
-- on fusionne CategoryMovies et CategoryAdSpots dans Category
--
INSERT INTO "AssoItemsCategories" (
  "createdAt", "updatedAt", "deleted",
  "itemId", "categoryId", "order"
)
SELECT
  "CategoryAdSpots"."createdAt", "CategoryAdSpots"."updatedAt", false as "deleted",
  "Items"."_id", "ItemsCategory"."_id", 0 as "order"
FROM
  "CategoryAdSpots"
INNER JOIN "Items" ON "Items"."oldId" = "CategoryAdSpots"."MovieId" AND ("Items"."oldType" = 'movie' OR "Items"."oldType" = 'serie')
INNER JOIN "Items" as "ItemsCategory" ON "ItemsCategory"."oldId" = "CategoryAdSpots"."CategoryId" AND "ItemsCategory"."oldType" = 'category'
;

INSERT INTO "AssoItemsCategories" (
  "createdAt", "updatedAt", "deleted",
  "itemId", "categoryId", "order"
)
SELECT
  "CategoryMovies"."createdAt", "CategoryMovies"."updatedAt", false as "deleted",
  "Items"."_id", "ItemsCategory"."_id", 1 as "order"
FROM
  "CategoryMovies"
INNER JOIN "Items" ON "Items"."oldId" = "CategoryMovies"."MovieId" AND ("Items"."oldType" = 'movie' OR "Items"."oldType" = 'serie')
INNER JOIN "Items" as "ItemsCategory" ON "ItemsCategory"."oldId" = "CategoryMovies"."CategoryId" AND "ItemsCategory"."oldType" = 'category'
WHERE
  ("Items"."_id", "ItemsCategory"."_id") NOT IN (
    SELECT "itemId", "categoryId" FROM "AssoItemsCategories"
  )
;

--
-- ACTEURS
--
-- Acteurs => Persons
DROP TABLE IF EXISTS "ElementsPersons";
CREATE TABLE "ElementsPersons"
(
  _id integer not null,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "deleted" boolean default false,
  "type" character varying(64),
  "firstName" character varying(255),
  "lastName" character varying(255),
  "imdbId" character varying(16),
  CONSTRAINT "ElementsPersons_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

-- fixme: slug actors
INSERT INTO "Items" (
  "createdAt", "updatedAt", "deleted", "type", "tenantId",
  "oldId", "oldUuid", "oldType",
  "title", "description", "translations", "catchupProviderId",
  "slug", "active", "dateFrom", "dateTo", "countries", "broadcasters"
)
SELECT
  "Actors"."createdAt", "Actors"."updatedAt", false as "deleted", 'person' as "type", 1 as "tenantId",
  "Actors"."_id" as "oldId", null as "oldUuid", 'actor' as "oldType",
  ("Actors"."firstName"||' '||"Actors"."lastName") as "title", null as "description",
  null as "translations", null as "catchupProviderId",
  null as "slug", "Actors"."active", null as "dateFrom", null as "dateTo", null as "countries", null as "broadcasters"
FROM
  "Actors"
WHERE
  ("Actors"."firstName"||' '||"Actors"."lastName") is not null AND  ("Actors"."firstName" is not null OR "Actors"."lastName" is not null);

INSERT INTO "ElementsPersons" (
  "_id", "createdAt","updatedAt","deleted",
  "type", "firstName","lastName","imdbId"
)
SELECT
  "Items"."_id" as "_id",
  "Actors"."createdAt", "Actors"."updatedAt", false as "delete",
  'actor' as "type", "Actors"."firstName", "Actors"."lastName", "Actors"."imdbId"
FROM
  "Actors"
INNER JOIN "Items" ON "Items"."oldId" = "Actors"."_id" and "Items"."oldType" = 'actor';

-- un poil complexe, on transfert la liaison Movies -> Actors
-- dans une liaison Item -> Actors
-- => on recherche les item video ou item serie liées aux anciennes movies
-- FIXME importer les series en premier
DROP TABLE IF EXISTS "AssoItemsPersons";
CREATE TABLE "AssoItemsPersons"
(
  _id serial not null,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "deleted" boolean default false,
  "itemId" integer not null,
  "personId" integer not null,
  CONSTRAINT "AssoItemsPersons_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

-- AssoItemsImages
-- AssoItemsActors
-- AssoItemsCategories


-- creation de vues materialisées


DROP MATERIALIZED VIEW IF EXISTS "VueMovies";
CREATE MATERIALIZED VIEW "VueMovies" AS
SELECT
  "Items"."oldId" as "_id",
  "Items"."title" as "title",
  "Items"."dateFrom" as "dateFrom",
  "Items"."dateTo" as "dateTo",
  "Items"."description" as "synopsis",
  'movie' as "type",
  "ElementsVideos".duration as "duration",
  "ElementsVideos"."imdbId" as "imdbId",
  null as "seasonId",
  "Items"."slug",
  null as "sort", -- FIXME lorsque l'on aura migré les categories
  "Items"."active",
  "ElementsVideos"."licensorId",
  null as "posterId",
  null as "logoId",
  null as "thumbId",
  null as "videoId",
  "ElementsVideos"."dateReleased",
  "ElementsVideos"."genre",
  null as "creation",
  "ElementsVideos"."schedule",
  "Items"."catchupProviderId",
  "ElementsVideos".live,
  "ElementsVideos"."productionCountry",
  "ElementsVideos"."CSA",
  "ElementsVideos"."rating",
  null as "vXstY",
  "Items"."countries",
  "Items"."broadcasters",
  "ElementsVideos"."youtubeTrailer",
  "ElementsVideos"."yearReleased",
  "Items"."createdAt",
  "Items"."updatedAt",
  "Items"."translations" -- fixme
FROM "Items"
INNER JOIN "ElementsVideos" ON "Items"._id = "ElementsVideos"._id
WHERE
  "Items"."oldId" is not null and "Items"."oldType" = 'movie'

UNION

SELECT
  "Items"."oldId" as "_id",
  "Items"."title" as "title",
  "Items"."dateFrom" as "dateFrom",
  "Items"."dateTo" as "dateTo",
  "Items"."description" as "synopsis",
  'serie' as "type",
  null as "duration",
  "ElementsSeries"."imdbId" as "imdbId",
  null as "seasonId",
  "Items"."slug",
  null as "sort", -- FIXME lorsque l'on aura migré les categories
  "Items"."active",
  "ElementsSeries"."licensorId",
  null as "posterId",
  null as "logoId",
  null as "thumbId",
  null as "videoId",
  "ElementsSeries"."dateReleased",
  "ElementsSeries"."genre",
  null as "creation",
  "ElementsSeries"."schedule",
  "Items"."catchupProviderId",
  false as "live",
  "ElementsSeries"."productionCountry",
  "ElementsSeries"."CSA",
  "ElementsSeries"."rating",
  null as "vXstY",
  "Items"."countries",
  "Items"."broadcasters",
  null as "youtubeTrailer", -- FIXME piocher ds le 1er episode ?
  "ElementsSeries"."yearReleased",
  "Items"."createdAt",
  "Items"."updatedAt",
  "Items"."translations" -- fixme
FROM "Items"
INNER JOIN "ElementsSeries" ON "Items"._id = "ElementsSeries"._id
WHERE
  "Items"."oldId" is not null and "Items"."oldType" = 'serie'
;

-- TODO:
-- migration des images sous forme d'Items
-- associations itemImages
-- itemId
-- deplacer le rating dans item
