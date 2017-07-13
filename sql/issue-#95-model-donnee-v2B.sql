-- simpler version

-- DROP ALL
DROP MATERIALIZED VIEW IF EXISTS "VueMovies";
DROP MATERIALIZED VIEW IF EXISTS "VueActors";
DROP MATERIALIZED VIEW IF EXISTS "VueCategoryMovies";
DROP MATERIALIZED VIEW IF EXISTS "VueCategoryAdSpots";
DROP MATERIALIZED VIEW IF EXISTS "VueActors";
DROP MATERIALIZED VIEW IF EXISTS "VueMoviesActors";
DROP MATERIALIZED VIEW IF EXISTS "VueUsersFavoritesMovies";


DROP TABLE IF EXISTS "CategoryElements";
DROP TABLE IF EXISTS "Tenants";
DROP TABLE IF EXISTS "Films";
DROP TABLE IF EXISTS "Lives";
DROP TABLE IF EXISTS "Series";
DROP TABLE IF EXISTS "Persons";
DROP TABLE IF EXISTS "AssoPersonsFilms";
DROP TABLE IF EXISTS "AssoPersonsSeries";
DROP TABLE IF EXISTS "AssoUsersFavoritesFilms";
DROP TABLE IF EXISTS "AssoUsersFavoritesLives";
DROP TABLE IF EXISTS "AssoUsersFavoritesSeries";

--
-- Tenants
--
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

--
-- DECOUPE DE MOVIES en FILMS,LIVES,SERIES
--
DROP TABLE IF EXISTS "Films";
CREATE TABLE "Films"
(
  _id serial NOT NULL,
  -- system
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  -- filters
  "dateFrom" timestamp with time zone,
  "dateTo" timestamp with time zone,
  countries character varying(2)[],
  broadcasters character varying(4)[],
  active boolean default false,
  -- FK
  "movieId" integer,
  "licensorId" integer,
  "posterId" uuid,
  "logoId" uuid,
  "thumbId" uuid,
  "videoId" uuid,
  "catchupProviderId" integer,
  "tenantId" integer NOT NULL,
  -- system
  translations jsonb,
  slug character varying(255),
  -- data
  title character varying(255) DEFAULT 'title'::character varying,
  synopsis text,
  "imdbId" character varying(255),
  genre character varying(255),
  creation character varying(255),
  schedule character varying(255),
  "productionCountry" character varying(64),
  "CSA" integer,
  "youtubeTrailer" character varying(255),
  "yearReleased" integer,
  -- cached
  rating numeric DEFAULT 3,
  duration numeric,
  --
  CONSTRAINT "Films_pkey" PRIMARY KEY (_id),
  CONSTRAINT "Films_licensorId_fkey" FOREIGN KEY ("licensorId")
      REFERENCES "Licensors" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Films_catchupProviderId_fkey" FOREIGN KEY ("catchupProviderId")
      REFERENCES "CatchupProviders" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Films_movieId_fkey" FOREIGN KEY ("movieId")
      REFERENCES "Movies" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Films_posterId_fkey" FOREIGN KEY ("posterId")
      REFERENCES "Images" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Films_logoId_fkey" FOREIGN KEY ("logoId")
      REFERENCES "Images" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Films_thumbId_fkey" FOREIGN KEY ("thumbId")
      REFERENCES "Images" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Films_videoId_fkey" FOREIGN KEY ("videoId")
      REFERENCES "Videos" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);


DROP TABLE IF EXISTS "Lives";
CREATE TABLE "Lives"
(
  _id serial NOT NULL,
  -- system
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  -- filters
  "dateFrom" timestamp with time zone,
  "dateTo" timestamp with time zone,
  countries character varying(2)[],
  broadcasters character varying(4)[],
  active boolean default false,
  -- FK
  "movieId" integer,
  "licensorId" integer,
  "posterId" uuid,
  "logoId" uuid,
  "thumbId" uuid,
  "videoId" uuid,
  "catchupProviderId" integer,
  "tenantId" integer NOT NULL,
  -- system
  translations jsonb,
  slug character varying(255),
  -- data
  title character varying(255) DEFAULT 'title'::character varying,
  synopsis text,
  genre character varying(255),
  creation character varying(255),
  schedule character varying(255),
  "productionCountry" character varying(64),
  "CSA" integer,
  "youtubeTrailer" character varying(255),
  -- cached
  rating numeric DEFAULT 3,
  --
  CONSTRAINT "Lives_pkey" PRIMARY KEY (_id),
  CONSTRAINT "Lives_licensorId_fkey" FOREIGN KEY ("licensorId")
      REFERENCES "Licensors" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Lives_catchupProviderId_fkey" FOREIGN KEY ("catchupProviderId")
      REFERENCES "CatchupProviders" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Lives_movieId_fkey" FOREIGN KEY ("movieId")
      REFERENCES "Movies" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Lives_posterId_fkey" FOREIGN KEY ("posterId")
      REFERENCES "Images" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Lives_logoId_fkey" FOREIGN KEY ("logoId")
      REFERENCES "Images" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Lives_thumbId_fkey" FOREIGN KEY ("thumbId")
      REFERENCES "Images" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Lives_videoId_fkey" FOREIGN KEY ("videoId")
      REFERENCES "Videos" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);



DROP TABLE IF EXISTS "Series";
CREATE TABLE "Series"
(
  _id serial NOT NULL,
  -- system
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  -- filters
  "dateFrom" timestamp with time zone,
  "dateTo" timestamp with time zone,
  countries character varying(2)[],
  broadcasters character varying(4)[],
  active boolean default false,
  -- FK
  "movieId" integer,
  "licensorId" integer,
  "posterId" uuid,
  "logoId" uuid,
  "thumbId" uuid,
  "videoId" uuid,
  "catchupProviderId" integer,
  "tenantId" integer NOT NULL,
  -- system
  translations jsonb,
  slug character varying(255),
  -- data
  title character varying(255) DEFAULT 'title'::character varying,
  synopsis text,
  "imdbId" character varying(255),
  genre character varying(255),
  creation character varying(255),
  schedule character varying(255),
  "productionCountry" character varying(64),
  "CSA" integer,
  "youtubeTrailer" character varying(255),
  "yearReleased" integer,
  -- cached
  rating numeric DEFAULT 3,
  --
  CONSTRAINT "Series_pkey" PRIMARY KEY (_id),
  CONSTRAINT "Series_licensorId_fkey" FOREIGN KEY ("licensorId")
      REFERENCES "Licensors" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Series_catchupProviderId_fkey" FOREIGN KEY ("catchupProviderId")
      REFERENCES "CatchupProviders" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Series_movieId_fkey" FOREIGN KEY ("movieId")
      REFERENCES "Movies" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Series_posterId_fkey" FOREIGN KEY ("posterId")
      REFERENCES "Images" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Series_logoId_fkey" FOREIGN KEY ("logoId")
      REFERENCES "Images" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Series_thumbId_fkey" FOREIGN KEY ("thumbId")
      REFERENCES "Images" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "Series_videoId_fkey" FOREIGN KEY ("videoId")
      REFERENCES "Videos" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);

--
-- clean old tables (garbage data...) caused by buggy scaffolded api.
--
UPDATE "Movies"
SET "posterId" = null
WHERE "_id" IN (
  -- white liste de movies sans poster
  select _id from "Movies"
  WHERE "posterId" NOT IN (
    select _id from "Images"
  )
);

UPDATE "Movies"
SET "logoId" = null
WHERE "_id" IN (
  -- white liste de movies sans poster
  select _id from "Movies"
  WHERE "logoId" NOT IN (
    select _id from "Images"
  )
);

UPDATE "Movies"
SET "thumbId" = null
WHERE "_id" IN (
  -- white liste de movies sans poster
  select _id from "Movies"
  WHERE "thumbId" NOT IN (
    select _id from "Images"
  )
);

--
-- inserting data
--
INSERT INTO "Films" (
  -- system
  "createdAt",
  "updatedAt",
  -- filters
  "dateFrom",
  "dateTo",
  countries,
  broadcasters,
  active,
  -- FK
  "movieId",
  "licensorId",
  "posterId",
  "logoId",
  "thumbId",
  "videoId",
  "catchupProviderId",
  "tenantId",
  -- system
  translations,
  -- data
  title,
  synopsis,
  "imdbId",
  slug,
  genre,
  creation,
  schedule,
  "productionCountry",
  "CSA",
  "youtubeTrailer",
  "yearReleased",
  -- cached
  rating,
  duration
)
SELECT
  "Movies"."createdAt", "Movies"."updatedAt",
  "Movies"."dateFrom", "Movies"."dateTo",
  "Movies"."countries", "Movies"."broadcasters", "Movies"."active",
  "Movies"."_id" as "movieId", "Movies"."licensorId", "Movies"."posterId",
  "Movies"."logoId", "Movies"."thumbId", "Movies"."videoId", "Movies"."catchupProviderId",
  1 as "tenantId",
  "Movies"."translations", "Movies"."title", "Movies"."synopsis",
  "Movies"."imdbId", "Movies"."slug", "Movies"."genre",
  "Movies"."creation", "Movies"."schedule", "Movies"."productionCountry",
  "Movies"."CSA", "Movies"."youtubeTrailer",
  "Movies"."yearReleased", "Movies"."rating", "Movies"."duration"
FROM
  "Movies"
WHERE
  "Movies"."type" = 'movie' AND live is not true;

INSERT INTO "Lives" (
  -- system
  "createdAt",
  "updatedAt",
  -- filters
  "dateFrom",
  "dateTo",
  countries,
  broadcasters,
  active,
  -- FK
  "movieId",
  "licensorId",
  "posterId",
  "logoId",
  "thumbId",
  "videoId",
  "catchupProviderId",
  "tenantId",
  -- system
  translations,
  -- data
  title,
  synopsis,
  slug,
  genre,
  creation,
  schedule,
  "productionCountry",
  "CSA",
  "youtubeTrailer",
  -- cached
  rating
)
SELECT
  "Movies"."createdAt", "Movies"."updatedAt",
  "Movies"."dateFrom", "Movies"."dateTo",
  "Movies"."countries", "Movies"."broadcasters", "Movies"."active",
  "Movies"."_id" as "movieId", "Movies"."licensorId", "Movies"."posterId",
  "Movies"."logoId", "Movies"."thumbId", "Movies"."videoId", "Movies"."catchupProviderId",
  1 as "tenantId",
  "Movies"."translations", "Movies"."title", "Movies"."synopsis",
  "Movies"."slug", "Movies"."genre",
  "Movies"."creation", "Movies"."schedule", "Movies"."productionCountry",
  "Movies"."CSA", "Movies"."youtubeTrailer",
  "Movies"."rating"
FROM
  "Movies"
WHERE
  "Movies"."type" = 'movie' AND live is true;

INSERT INTO "Series" (
  -- system
  "createdAt",
  "updatedAt",
  -- filters
  "dateFrom",
  "dateTo",
  countries,
  broadcasters,
  active,
  -- FK
  "movieId",
  "licensorId",
  "posterId",
  "logoId",
  "thumbId",
  "videoId",
  "catchupProviderId",
  "tenantId",
  -- system
  translations,
  -- data
  title,
  synopsis,
  "imdbId",
  slug,
  genre,
  creation,
  schedule,
  "productionCountry",
  "CSA",
  "youtubeTrailer",
  "yearReleased",
  -- cached
  rating
)
SELECT
  "Movies"."createdAt", "Movies"."updatedAt",
  "Movies"."dateFrom", "Movies"."dateTo",
  "Movies"."countries", "Movies"."broadcasters", "Movies"."active",
  "Movies"."_id" as "movieId", "Movies"."licensorId", "Movies"."posterId",
  "Movies"."logoId", "Movies"."thumbId", "Movies"."videoId", "Movies"."catchupProviderId",
  1 as "tenantId",
  "Movies"."translations", "Movies"."title", "Movies"."synopsis",
  "Movies"."imdbId", "Movies"."slug", "Movies"."genre",
  "Movies"."creation", "Movies"."schedule", "Movies"."productionCountry",
  "Movies"."CSA", "Movies"."youtubeTrailer",
  "Movies"."yearReleased", "Movies"."rating"
FROM
  "Movies"
WHERE
  "Movies"."type" = 'serie';

-- refactoring liaisons seasons -> series
ALTER TABLE "Seasons" DROP COLUMN IF EXISTS "serieId";
ALTER TABLE "Seasons" ADD COLUMN "serieId" integer;

-- linking seasons to series
UPDATE "Seasons"
SET "serieId" = "Series"."_id"
FROM "Series"
WHERE "Seasons"."movieId" = "Series"."movieId";

--
-- building new associations between categories & series through two tables.
-- Category <-> AssoCategoriesCategoryElements <-> CategoryElement <-> {Film,Live,Serie}
--
DROP TABLE IF EXISTS "CategoryElements";
CREATE TABLE "CategoryElements"
(
  "_id" serial NOT NULL,
  -- system
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  --
  "tenantId" integer NOT NULL,
  --
  "categoryId" integer,
  "filmId" integer,
  "liveId" integer,
  "serieId" integer,
  "order" integer default 0,
  "spot" boolean default false,
  CONSTRAINT "CategoryElements_pkey" PRIMARY KEY ("_id"),
  CONSTRAINT "CategoryElements_categoryId_fkey" FOREIGN KEY ("categoryId")
      REFERENCES "Categories" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "CategoryElements_filmId_fkey" FOREIGN KEY ("filmId")
      REFERENCES "Films" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "CategoryElements_liveId_fkey" FOREIGN KEY ("liveId")
      REFERENCES "Lives" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "CategoryElements_serieId_fkey" FOREIGN KEY ("serieId")
      REFERENCES "Series" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);

INSERT INTO "CategoryElements"(
  "createdAt",
  "updatedAt",
  "tenantId",
  "categoryId",
  "filmId",
  "liveId",
  "serieId",
  "order",
  "spot"
)
SELECT
  max("createdAt") as "createdAt", max("updatedAt") as "updatedAt",
  "tenantId", "categoryId", "filmId", "liveId", "serieId",
  max("sort") as "order",
  bool_or("spot") as "spot"
 FROM (
  (
    SELECT
      "CategoryMovies"."createdAt",
      "CategoryMovies"."updatedAt",
      1 as "tenantId",
      "CategoryMovies"."CategoryId" as "categoryId",
      "Films"."_id" as "filmId",
      "Lives"."_id" as "liveId",
      "Series"."_id" as "serieId",
      CASE WHEN "Movies"."sort" IS NULL THEN 0 ELSE "Movies"."sort" END as "sort",
      false as "spot"
    FROM
      "CategoryMovies"
    INNER JOIN "Movies" ON "Movies"."_id" = "CategoryMovies"."MovieId"
    LEFT JOIN "Films" ON "Films"."movieId" = "CategoryMovies"."MovieId"
    LEFT JOIN "Lives" ON "Lives"."movieId" = "CategoryMovies"."MovieId"
    LEFT JOIN "Series" ON "Series"."movieId" = "CategoryMovies"."MovieId"
  )
  UNION
  (
    SELECT
      "CategoryAdSpots"."createdAt",
      "CategoryAdSpots"."updatedAt",
      1 as "tenantId",
      "CategoryAdSpots"."CategoryId" as "categoryId",
      "Films"."_id" as "filmId",
      "Lives"."_id" as "liveId",
      "Series"."_id" as "serieId",
      CASE WHEN "Movies"."sort" IS NULL THEN 0 ELSE "Movies"."sort" END as "sort",
      true as "spot"
    FROM
      "CategoryAdSpots"
    INNER JOIN "Movies" ON "Movies"."_id" = "CategoryAdSpots"."MovieId"
    LEFT JOIN "Films" ON "Films"."movieId" = "CategoryAdSpots"."MovieId"
    LEFT JOIN "Lives" ON "Lives"."movieId" = "CategoryAdSpots"."MovieId"
    LEFT JOIN "Series" ON "Series"."movieId" = "CategoryAdSpots"."MovieId"
  )
) as warf
WHERE
  "filmId" IS NOT NULL OR
  "liveId" IS NOT NULL OR
  "serieId" IS NOT NULL
GROUP BY "tenantId", "categoryId", "filmId", "liveId", "serieId"
;

--
-- Actors => Persons
--
DROP TABLE IF EXISTS "Persons";
CREATE TABLE "Persons"
(
  _id serial NOT NULL,
  -- system
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  -- filters
  active boolean DEFAULT false,
  -- data
  "type" character varying(16) default 'actor'::character varying,
  "firstName" character varying(255),
  "lastName" character varying(255),
  translations jsonb,
  -- fk
  "tenantId" integer DEFAULT 1,
  "pictureId" uuid,
  "imdbId" character varying(16),
  "actorId" integer,
  CONSTRAINT "Persons_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

INSERT INTO "Persons" (
  "createdAt",
  "updatedAt",
  "active",
  "type",
  "firstName",
  "lastName",
  "translations",
  "tenantId",
  "pictureId",
  "imdbId",
  "actorId"
)
SELECT
  "createdAt",
  "updatedAt",
  "active",
  'actor' as "type",
  "firstName",
  "lastName",
  "translations",
  1 as "tenantId",
  "pictureId",
  "imdbId",
  "_id" as "actorId"
FROM
  "Actors";

--
--
--
DROP TABLE IF EXISTS "AssoPersonsFilms";
CREATE TABLE "AssoPersonsFilms"
(
  -- system
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  --
  "tenantId" integer NOT NULL,
  --
  "filmId" integer,
  "personId" integer,
  CONSTRAINT "AssoPersonsFilms_pkey"  PRIMARY KEY ("filmId", "personId"),
  CONSTRAINT "AssoPersonsFilms_filmId_fkey" FOREIGN KEY ("filmId")
      REFERENCES "Films" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "AssoPersonsFilms_personId_fkey" FOREIGN KEY ("personId")
      REFERENCES "Persons" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);

INSERT INTO "AssoPersonsFilms" (
  "createdAt", "updatedAt", "tenantId", "filmId", "personId"
)
SELECT
  "MoviesActors"."createdAt",
  "MoviesActors"."updatedAt",
  1 as "tenantId",
  "Films"."_id" as "filmId",
  "Persons"."_id" as "personId"
FROM
  "MoviesActors"
INNER JOIN "Films" ON "Films"."movieId" = "MoviesActors"."MovieId"
INNER JOIN "Persons" ON "Persons"."actorId" = "MoviesActors"."ActorId";


DROP TABLE IF EXISTS "AssoPersonsSeries";
CREATE TABLE "AssoPersonsSeries"
(
  -- system
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  --
  "tenantId" integer NOT NULL,
  --
  "serieId" integer,
  "personId" integer,
  CONSTRAINT "AssoPersonsSeries_pkey"  PRIMARY KEY ("serieId", "personId"),
  CONSTRAINT "AssoPersonsSeries_filmId_fkey" FOREIGN KEY ("serieId")
      REFERENCES "Series" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "AssoPersonsSeries_personId_fkey" FOREIGN KEY ("personId")
      REFERENCES "Persons" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);

INSERT INTO "AssoPersonsSeries" (
  "createdAt", "updatedAt", "tenantId", "serieId", "personId"
)
SELECT
  "MoviesActors"."createdAt",
  "MoviesActors"."updatedAt",
  1 as "tenantId",
  "Series"."_id" as "serieId",
  "Persons"."_id" as "personId"
FROM
  "MoviesActors"
INNER JOIN "Series" ON "Series"."movieId" = "MoviesActors"."MovieId"
INNER JOIN "Persons" ON "Persons"."actorId" = "MoviesActors"."ActorId";


DROP TABLE IF EXISTS "AssoUsersFavoritesFilms";
CREATE TABLE "AssoUsersFavoritesFilms"
(
  -- system
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  --
  "tenantId" integer NOT NULL,
  --
  "userId" integer,
  "filmId" integer,
  CONSTRAINT "AssoUsersFavoritesFilms_pkey"  PRIMARY KEY ("userId", "filmId"),
  CONSTRAINT "AssoUsersFavoritesFilms_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES "Users" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "AssoUsersFavoritesFilms_filmId_fkey" FOREIGN KEY ("filmId")
      REFERENCES "Films" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);

INSERT INTO "AssoUsersFavoritesFilms" (
  "createdAt",
  "updatedAt",
  "tenantId",
  "userId",
  "filmId"
)
SELECT
  "UsersFavoritesMovies"."createdAt",
  "UsersFavoritesMovies"."updatedAt",
  1 as "tenantId",
  "UsersFavoritesMovies"."userId",
  "Films"."_id" as "filmId"
FROM
  "UsersFavoritesMovies"
INNER JOIN "Films" ON "Films"."movieId" = "UsersFavoritesMovies"."movieId";


DROP TABLE IF EXISTS "AssoUsersFavoritesLives";
CREATE TABLE "AssoUsersFavoritesLives"
(
  -- system
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  --
  "tenantId" integer NOT NULL,
  --
  "userId" integer,
  "liveId" integer,
  CONSTRAINT "AssoUsersFavoritesLives_pkey"  PRIMARY KEY ("userId", "liveId"),
  CONSTRAINT "AssoUsersFavoritesLives_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES "Users" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "AssoUsersFavoritesLives_liveId_fkey" FOREIGN KEY ("liveId")
      REFERENCES "Lives" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);

INSERT INTO "AssoUsersFavoritesLives" (
  "createdAt",
  "updatedAt",
  "tenantId",
  "userId",
  "liveId"
)
SELECT
  "UsersFavoritesMovies"."createdAt",
  "UsersFavoritesMovies"."updatedAt",
  1 as "tenantId",
  "UsersFavoritesMovies"."userId",
  "Lives"."_id" as "liveId"
FROM
  "UsersFavoritesMovies"
INNER JOIN "Lives" ON "Lives"."movieId" = "UsersFavoritesMovies"."movieId";


DROP TABLE IF EXISTS "AssoUsersFavoritesSeries";
CREATE TABLE "AssoUsersFavoritesSeries"
(
  -- system
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  --
  "tenantId" integer NOT NULL,
  --
  "userId" integer,
  "serieId" integer,
  CONSTRAINT "AssoUsersFavoritesSeries_pkey"  PRIMARY KEY ("userId", "serieId"),
  CONSTRAINT "AssoUsersFavoritesSeries_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES "Users" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "AssoUsersFavoritesSeries_liveId_fkey" FOREIGN KEY ("serieId")
      REFERENCES "Series" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);

INSERT INTO "AssoUsersFavoritesSeries" (
  "createdAt",
  "updatedAt",
  "tenantId",
  "userId",
  "serieId"
)
SELECT
  "UsersFavoritesMovies"."createdAt",
  "UsersFavoritesMovies"."updatedAt",
  1 as "tenantId",
  "UsersFavoritesMovies"."userId",
  "Series"."_id" as "liveId"
FROM
  "UsersFavoritesMovies"
INNER JOIN "Series" ON "Series"."movieId" = "UsersFavoritesMovies"."movieId";

--
-- Tenants
--
-- adding tenant to all existing tables
ALTER TABLE "AccessTokens" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "AccessTokens" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Actors" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Actors" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Assets" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Assets" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "AuthCodes" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "AuthCodes" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Broadcasters" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Broadcasters" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "CacheUsersSubscriptions" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "CacheUsersSubscriptions" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Captions" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Captions" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "CatchupProviders" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "CatchupProviders" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Categories" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Categories" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "CategoryAdSpots" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "CategoryAdSpots" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "CategoryElements" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "CategoryElements" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "CategoryMovies" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "CategoryMovies" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Clients" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Clients" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Comments" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Comments" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Configs" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Configs" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Countries" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Countries" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Episodes" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Episodes" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "ExportsBouygues" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "ExportsBouygues" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "ExportsOCI" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "ExportsOCI" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "ExportsOSearch" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "ExportsOSearch" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Films" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Films" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Genres" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Genres" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "GiftGivers" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "GiftGivers" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Images" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Images" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Languages" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Languages" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Licensors" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Licensors" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "LifePins" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "LifePins" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "LifeSpots" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "LifeSpots" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "LifeThemePins" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "LifeThemePins" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "LifeThemes" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "LifeThemes" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "LifeThemeSpots" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "LifeThemeSpots" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "LifeUsersFollowers" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "LifeUsersFollowers" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "LifeUsersPins" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "LifeUsersPins" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Lives" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Lives" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Logs" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Logs" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "LogsPixel" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "LogsPixel" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Movies" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Movies" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "MoviesActors" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "MoviesActors" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Notifications" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Notifications" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "PFGroups" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "PFGroups" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "PFGroupsProfiles" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "PFGroupsProfiles" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "PFProfiles" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "PFProfiles" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "platform" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "platform" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "platform_export" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "platform_export" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Posts" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Posts" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Presses" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Presses" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "RefreshTokens" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "RefreshTokens" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Seasons" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Seasons" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Series" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Series" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "spatial_ref_sys" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "spatial_ref_sys" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Stores" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Stores" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Tags" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Tags" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Tenants" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Tenants" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Users" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Users" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "UsersFavoritesEpisodes" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "UsersFavoritesEpisodes" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "UsersFavoritesMovies" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "UsersFavoritesMovies" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "UsersFavoritesSeasons" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "UsersFavoritesSeasons" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "UsersVideos" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "UsersVideos" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Videos" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Videos" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "VideosComments" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "VideosComments" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "VueMovies" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "VueMovies" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "WaitingUsers" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "WaitingUsers" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "WallNotes" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "WallNotes" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "WallNotesUsers" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "WallNotesUsers" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Widgets" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Widgets" ADD COLUMN "tenantId" integer DEFAULT 1;
ALTER TABLE "Works" DROP COLUMN IF EXISTS "tenantId";
ALTER TABLE "Works" ADD COLUMN "tenantId" integer DEFAULT 1;

--
-- reversing process: creating vues
--
DROP MATERIALIZED VIEW IF EXISTS "VueMovies";
CREATE MATERIALIZED VIEW "VueMovies" AS
SELECT
  "Films"."movieId" as "_id",
  "Films"."title",
  "Films"."dateFrom",
  "Films"."dateTo",
  "Films".synopsis,
  'movie' as "type",
  "Films".duration,
  "Films"."imdbId",
  null as "seasonId",
  "Films".slug,
  null as "sort", -- FIXME: will this cause a problem ?
  "Films".active,
  "Films"."licensorId",
  "Films"."posterId",
  "Films"."logoId",
  "Films"."thumbId",
  "Films"."videoId",
  null as "dateReleased",
  "Films".genre,
  "Films".creation,
  "Films".schedule,
  "Films"."catchupProviderId",
  false as "live",
  "Films"."productionCountry",
  "Films"."CSA",
  "Films".rating,
  null as "vXstY",
  "Films".countries,
  "Films".broadcasters,
  "Films"."youtubeTrailer",
  "Films"."yearReleased",
  "Films"."createdAt",
  "Films"."updatedAt",
  "Films".translations
FROM "Films"
WHERE
  "Films"."tenantId" = 1

UNION

SELECT
  "Lives"."movieId" as "_id",
  "Lives"."title",
  "Lives"."dateFrom",
  "Lives"."dateTo",
  "Lives".synopsis,
  'movie' as "type",
  null as "duration",
  null as "imdbId",
  null as "seasonId",
  "Lives".slug,
  null as "sort", -- FIXME: will this cause a problem ?
  "Lives".active,
  "Lives"."licensorId",
  "Lives"."posterId",
  "Lives"."logoId",
  "Lives"."thumbId",
  "Lives"."videoId",
  null as "dateReleased",
  "Lives".genre,
  "Lives".creation,
  "Lives".schedule,
  "Lives"."catchupProviderId",
  true as "live",
  "Lives"."productionCountry",
  "Lives"."CSA",
  "Lives".rating,
  null as "vXstY",
  "Lives".countries,
  "Lives".broadcasters,
  "Lives"."youtubeTrailer",
  null as "yearReleased",
  "Lives"."createdAt",
  "Lives"."updatedAt",
  "Lives".translations
FROM "Lives"
WHERE
  "Lives"."tenantId" = 1

UNION

SELECT
  "Series"."movieId" as "_id",
  "Series"."title",
  "Series"."dateFrom",
  "Series"."dateTo",
  "Series".synopsis,
  'serie' as "type",
  null as "duration",
  "Series"."imdbId",
  null as "seasonId",
  "Series".slug,
  null as "sort", -- FIXME: will this cause a problem ?
  "Series".active,
  "Series"."licensorId",
  "Series"."posterId",
  "Series"."logoId",
  "Series"."thumbId",
  "Series"."videoId",
  null as "dateReleased",
  "Series".genre,
  "Series".creation,
  "Series".schedule,
  "Series"."catchupProviderId",
  false as "live",
  "Series"."productionCountry",
  "Series"."CSA",
  "Series".rating,
  null as "vXstY",
  "Series".countries,
  "Series".broadcasters,
  "Series"."youtubeTrailer",
  "Series"."yearReleased",
  "Series"."createdAt",
  "Series"."updatedAt",
  "Series".translations
FROM "Series"
WHERE
  "Series"."tenantId" = 1;

DROP MATERIALIZED VIEW IF EXISTS "VueCategoryMovies";
CREATE MATERIALIZED VIEW "VueCategoryMovies" AS
SELECT
  "CategoryElements"."categoryId" as "CategoryId",
  "Films"."movieId" as "MovieId",
  "CategoryElements"."createdAt",
  "CategoryElements"."updatedAt",
  "CategoryElements"."tenantId"
FROM
  "CategoryElements"
INNER JOIN
  "Films" ON "CategoryElements"."filmId" = "Films"."_id"
WHERE
  "CategoryElements"."tenantId" = 1

UNION

SELECT
  "CategoryElements"."categoryId" as "CategoryId",
  "Lives"."movieId" as "MovieId",
  "CategoryElements"."createdAt",
  "CategoryElements"."updatedAt",
  "CategoryElements"."tenantId"
FROM
  "CategoryElements"
INNER JOIN
  "Lives" ON "CategoryElements"."filmId" = "Lives"."_id"
WHERE
  "CategoryElements"."tenantId" = 1

UNION

SELECT
  "CategoryElements"."categoryId" as "CategoryId",
  "Series"."movieId" as "MovieId",
  "CategoryElements"."createdAt",
  "CategoryElements"."updatedAt",
  "CategoryElements"."tenantId"
FROM
  "CategoryElements"
INNER JOIN
  "Series" ON "CategoryElements"."filmId" = "Series"."_id"
WHERE
  "CategoryElements"."tenantId" = 1;

-- same but restricted on CategoryElements.spot=true
DROP MATERIALIZED VIEW IF EXISTS "VueCategoryAdSpots";
CREATE MATERIALIZED VIEW "VueCategoryAdSpots" AS
SELECT
  "CategoryElements"."categoryId" as "CategoryId",
  "Films"."movieId" as "MovieId",
  "CategoryElements"."createdAt",
  "CategoryElements"."updatedAt",
  "CategoryElements"."tenantId"
FROM
  "CategoryElements"
INNER JOIN
  "Films" ON "CategoryElements"."filmId" = "Films"."_id"
WHERE
  "CategoryElements"."tenantId" = 1 AND "CategoryElements"."spot" = true

UNION

SELECT
  "CategoryElements"."categoryId" as "CategoryId",
  "Lives"."movieId" as "MovieId",
  "CategoryElements"."createdAt",
  "CategoryElements"."updatedAt",
  "CategoryElements"."tenantId"
FROM
  "CategoryElements"
INNER JOIN
  "Lives" ON "CategoryElements"."filmId" = "Lives"."_id"
WHERE
  "CategoryElements"."tenantId" = 1 AND "CategoryElements"."spot" = true

UNION

SELECT
  "CategoryElements"."categoryId" as "CategoryId",
  "Series"."movieId" as "MovieId",
  "CategoryElements"."createdAt",
  "CategoryElements"."updatedAt",
  "CategoryElements"."tenantId"
FROM
  "CategoryElements"
INNER JOIN
  "Series" ON "CategoryElements"."filmId" = "Series"."_id"
WHERE
  "CategoryElements"."tenantId" = 1 AND "CategoryElements"."spot" = true;

--
DROP MATERIALIZED VIEW IF EXISTS "VueActors";
CREATE MATERIALIZED VIEW "VueActors" AS
SELECT
  "Persons"."actorId" as _id,
  "Persons"."firstName",
  "Persons"."lastName",
  "Persons"."pictureId",
  "Persons"."imdbId",
  "Persons"."active",
  "Persons"."createdAt" ,
  "Persons"."updatedAt",
  "Persons"."translations",
  "Persons"."tenantId"
FROM
  "Persons"
WHERE
  "Persons"."type"='actor';

DROP MATERIALIZED VIEW IF EXISTS "VueMoviesActors";
CREATE MATERIALIZED VIEW "VueMoviesActors" AS
SELECT
  "Films"."movieId" as "MovieId",
  "Persons"."actorId" as "ActorId",
  "AssoPersonsFilms"."createdAt",
  "AssoPersonsFilms"."updatedAt" ,
  "AssoPersonsFilms"."tenantId"
FROM
  "AssoPersonsFilms"
INNER JOIN "Persons" ON "AssoPersonsFilms"."personId" = "Persons"."_id"
INNER JOIN "Films" ON "AssoPersonsFilms"."filmId" = "Films"."_id"
WHERE
  "Persons"."type" = 'actor'

UNION

SELECT
  "Series"."movieId" as "MovieId",
  "Persons"."actorId" as "ActorId",
  "AssoPersonsSeries"."createdAt",
  "AssoPersonsSeries"."updatedAt" ,
  "AssoPersonsSeries"."tenantId"
FROM
  "AssoPersonsSeries"
INNER JOIN "Persons" ON "AssoPersonsSeries"."personId" = "Persons"."_id"
INNER JOIN "Series" ON "AssoPersonsSeries"."serieId" = "Series"."_id"
WHERE
  "Persons"."type" = 'actor';

DROP MATERIALIZED VIEW IF EXISTS "VueUsersFavoritesMovies";
CREATE MATERIALIZED VIEW "VueUsersFavoritesMovies" AS
SELECT
  "AssoUsersFavoritesFilms"."userId",
  "Films"."movieId",
  "AssoUsersFavoritesFilms"."createdAt",
  "AssoUsersFavoritesFilms"."updatedAt",
  "AssoUsersFavoritesFilms"."tenantId"
FROM
  "AssoUsersFavoritesFilms"
INNER JOIN "Films" ON "AssoUsersFavoritesFilms"."filmId" = "Films"."_id"

UNION

SELECT
  "AssoUsersFavoritesLives"."userId",
  "Lives"."movieId",
  "AssoUsersFavoritesLives"."createdAt",
  "AssoUsersFavoritesLives"."updatedAt",
  "AssoUsersFavoritesLives"."tenantId"
FROM
  "AssoUsersFavoritesLives"
INNER JOIN "Lives" ON "AssoUsersFavoritesLives"."liveId" = "Lives"."_id"

UNION

SELECT
  "AssoUsersFavoritesSeries"."userId",
  "Series"."movieId",
  "AssoUsersFavoritesSeries"."createdAt",
  "AssoUsersFavoritesSeries"."updatedAt",
  "AssoUsersFavoritesSeries"."tenantId"
FROM
  "AssoUsersFavoritesSeries"
INNER JOIN "Series" ON "AssoUsersFavoritesSeries"."serieId" = "Series"."_id";