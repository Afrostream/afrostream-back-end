-- DROP TABLE "VideosComments"

CREATE TABLE "VideosComments"
(
  _id serial NOT NULL,
  "userId" integer,
  "videoId" uuid,
  "createdAt" timestamp with time zone,
  "timecode" character varying(12),
  "text" character varying(140),
  CONSTRAINT "VideosComments_pkey" PRIMARY KEY ("_id"),
  CONSTRAINT "VideosComments_UserId_fkey" FOREIGN KEY ("userId")
    REFERENCES "Users" (_id) MATCH SIMPLE
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "VideosComments_VideoId_fkey" FOREIGN KEY ("videoId")
    REFERENCES "Videos" (_id) MATCH SIMPLE
    ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);


ALTER TABLE "Users" ADD COLUMN nickname character varying(32);
