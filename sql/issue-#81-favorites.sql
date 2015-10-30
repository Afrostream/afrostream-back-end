-- Table: "UsersFavoritesMovies"
-- DROP TABLE "UsersFavoritesMovies";
CREATE TABLE "UsersFavoritesMovies"
(
  _id serial NOT NULL,
  "userId" serial,
  "movieId" integer,
  CONSTRAINT "UsersFavoritesMovies_pkey" PRIMARY KEY (_id),
  UNIQUE ("userId", "movieId"),
  CONSTRAINT "UsersFavoritesMovies_UserId_fkey" FOREIGN KEY ("userId")
        REFERENCES "Users" (_id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "UsersFavoritesMovies_MovieId_fkey" FOREIGN KEY ("movieId")
        REFERENCES "Movies" (_id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);
-- ALTER TABLE "UsersFavoritesMovies" OWNER TO postgres;

-- Table: "UsersFavoritesSeasons"
-- DROP TABLE "UsersFavoritesSeasons";
CREATE TABLE "UsersFavoritesSeasons"
(
  _id serial NOT NULL,
  "userId" serial,
  "seasonId" integer,
  CONSTRAINT "UsersFavoritesSeasons_pkey" PRIMARY KEY (_id),
  UNIQUE ("userId", "seasonId"),
  CONSTRAINT "UsersFavoritesSeasons_UserId_fkey" FOREIGN KEY ("userId")
        REFERENCES "Users" (_id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "UsersFavoritesSeasons_SeasonId_fkey" FOREIGN KEY ("seasonId")
        REFERENCES "Seasons" (_id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);
-- ALTER TABLE "UsersFavoritesSeasons_pkey" OWNER TO postgres;

-- Table: "UsersFavoritesEpisodes"
-- DROP TABLE "UsersFavoritesEpisodes";
CREATE TABLE "UsersFavoritesEpisodes"
(
  _id serial NOT NULL,
  "userId" serial,
  "episodeId" integer,
  CONSTRAINT "UsersFavoritesEpisodes_pkey" PRIMARY KEY (_id),
  UNIQUE ("userId", "episodeId"),
  CONSTRAINT "UsersFavoritesEpisodes_UserId_fkey" FOREIGN KEY ("userId")
        REFERENCES "Users" (_id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "UsersFavoritesEpisodes_EpisodeId_fkey" FOREIGN KEY ("episodeId")
        REFERENCES "Episodes" (_id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);
-- ALTER TABLE "UsersFavoritesEpisodes_pkey" OWNER TO postgres;

-- FIXME: favori de genre et de category