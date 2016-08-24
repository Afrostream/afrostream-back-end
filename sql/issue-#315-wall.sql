-- DROP TABLE "WallNotes"
CREATE TABLE "WallNotes"
(
  _id serial NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "scoreUpdatedAt" timestamp with time zone,
  "userId" integer,
  active boolean DEFAULT true, -- post modération
  "type" character varying(16),
  score integer DEFAULT 0,
  "content" json,
  CONSTRAINT "WallNotes_pkey" PRIMARY KEY ("_id"),
  CONSTRAINT "WallNotes_UserId_fkey" FOREIGN KEY ("userId")
    REFERENCES "Users" (_id) MATCH SIMPLE
    ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);

-- DROP TABLE "WallNotesUsers"
CREATE TABLE "WallNotesUsers"
(
  _id serial NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "userId" integer,
  "wallNoteId" integer,
  score integer,
  CONSTRAINT "WallNotesUsers_pkey" PRIMARY KEY ("_id"),
  CONSTRAINT "WallNotesUsers_UserId_fkey" FOREIGN KEY ("userId")
    REFERENCES "Users" (_id) MATCH SIMPLE
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT "WallNotesUsers_WallNoteId_fkey" FOREIGN KEY ("wallNoteId")
    REFERENCES "WallNotes" (_id) MATCH SIMPLE
    ON UPDATE CASCADE ON DELETE CASCADE
)
WITH (
  OIDS=FALSE
);
