CREATE TABLE "LogsPixel"
(
  _id serial NOT NULL,
  "createdAt" timestamp with time zone,
  data json,
  CONSTRAINT "LogsPixel_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);
