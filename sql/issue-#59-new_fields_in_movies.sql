ALTER TABLE "Movies" ADD COLUMN "dateReleased" timestamp with time zone;
ALTER TABLE "Movies" ADD COLUMN "genre" character varying(255);    -- FIXME: genre ou type ?
ALTER TABLE "Movies" ADD COLUMN "creation" character varying(255); -- FIXME: quel est le contenu de ce champ ?

-- Table: "MoviesActors"

-- DROP TABLE "MoviesActors";

CREATE TABLE "MoviesActors"
(
  "MovieId" integer NOT NULL,
  "ActorId" integer NOT NULL,
  CONSTRAINT "MovieActor_pkey" PRIMARY KEY ("MovieId", "ActorId"),
  CONSTRAINT "MovieActor_MovieId_fkey" FOREIGN KEY ("MovieId")
      REFERENCES "Movies" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "MovieActor_ActorId_fkey" FOREIGN KEY ("ActorId")
      REFERENCES "Actors" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);
-- ALTER TABLE "MoviesActors" OWNER TO postgres;