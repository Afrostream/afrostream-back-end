-- Table: "UsersVideos"
-- DROP TABLE "UsersVideos";
CREATE TABLE "UsersVideos"
(
  _id serial NOT NULL,
  "userId" integer,
  "videoId" uuid,
  "dateStartRead" timestamp with time zone NOT NULL,
  "dateLastRead" timestamp with time zone NOT NULL,
  "playerPosition" integer, -- seconds
  "playerAudio" character varying(3),
  "playerCaption" character varying(3),
  "rating" integer,
  CONSTRAINT "UsersVideos_pkey" PRIMARY KEY (_id),
  UNIQUE ("userId", "videoId"),
  CONSTRAINT "UsersVideos_UserId_fkey" FOREIGN KEY ("userId")
        REFERENCES "Users" (_id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "UsersVideos_VideoId_fkey" FOREIGN KEY ("videoId")
        REFERENCES "Videos" (_id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);