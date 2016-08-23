-- DROP TABLE "VideosComments"

CREATE TABLE "VideosComments"
(
  _id serial NOT NULL,
  "userId" integer,
  "videoId" uuid,
  "createdAt" timestamp with time zone,
  "timecode" integer, -- pas un vrai timecode
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


-- examples staging

insert into "VideosComments" ("userId", "videoId", timecode, text) VALUES(1, 'c1ee3b32-0bf8-4873-b173-09dc055b7bfe', 1, 'AHAHAHAHAH');
insert into "VideosComments" ("userId", "videoId", timecode, text) VALUES(1, 'c1ee3b32-0bf8-4873-b173-09dc055b7bfe', 5, 'youpi!');
insert into "VideosComments" ("userId", "videoId", timecode, text) VALUES(1, 'c1ee3b32-0bf8-4873-b173-09dc055b7bfe', 5, 'Géniale cette vidéooo WHOHOHOHOHOHOHOHOHOHOHO');
insert into "VideosComments" ("userId", "videoId", timecode, text) VALUES(1, 'c1ee3b32-0bf8-4873-b173-09dc055b7bfe', 6, 'AHAHAHAHAH :)');
insert into "VideosComments" ("userId", "videoId", timecode, text) VALUES(1, 'c1ee3b32-0bf8-4873-b173-09dc055b7bfe', 15, 'test 2');
insert into "VideosComments" ("userId", "videoId", timecode, text) VALUES(1, 'c1ee3b32-0bf8-4873-b173-09dc055b7bfe', 25, 'Un autre super commentaire inlined !');
insert into "VideosComments" ("userId", "videoId", timecode, text) VALUES(1, 'c1ee3b32-0bf8-4873-b173-09dc055b7bfe', 30, '01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789');
