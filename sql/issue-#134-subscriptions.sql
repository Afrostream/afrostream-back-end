-- Table: "CacheUsersSubscriptions"

-- DROP TABLE "CacheUsersSubscriptions";

CREATE TABLE "CacheUsersSubscriptions"
(
  _id serial NOT NULL,
  "cacheCreatedAt" timestamp with time zone NOT NULL,
  "cacheUpdatedAt" timestamp with time zone NOT NULL,
  "userId" integer,
  "planCode" character varying(32),
  -- "accountCode" character varying(128),
  state character varying(32),
  -- "activatedAt" timestamp with time zone,
  -- "canceledAt" timestamp with time zone,
  "expiresAt" timestamp with time zone,
  CONSTRAINT "CacheUsersSubscriptions_pkey" PRIMARY KEY (_id),
  CONSTRAINT "CacheUsersSubscriptions_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES "Users" (_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)
WITH (
  OIDS=FALSE
);
-- ALTER TABLE "CacheUsersSubscriptions" OWNER TO postgres;
