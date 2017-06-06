DROP TABLE "MailerLists";
DROP TABLE "MailerProviders";
DROP TABLE "MailerAssoProvidersLists";
DROP TABLE "MailerWorkers";
DROP TABLE "MailerAssoListsWorkers";
DROP TABLE "MailerSubscribers";
DROP TABLE "MailerAssoListsSubscribers";
DROP TABLE "MailerTemplates";
DROP TABLE "MailerTransactions";

CREATE TABLE "MailerLists"
(
  _id uuid NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  name character varying(255),
  query text,
  "disabled" boolean default false,
  CONSTRAINT "MailerLists_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

-- ex: mailblast, mandril, ...
CREATE TABLE "MailerProviders"
(
  _id uuid NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  name character varying(255),
  token character varying(255),
  CONSTRAINT "MailerProviders_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

CREATE TABLE "MailerAssoProvidersLists"
(
  _id serial NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "listId" uuid NOT NULL,
  "providerId" uuid NOT NULL,
  "pApiId" character varying(255),
  "pApiStatus" json
)
WITH (
  OIDS=FALSE
);

-- 1 liste peut avoir N hooks
CREATE TABLE "MailerWorkers"
(
  _id uuid NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  name character varying(255),
  CONSTRAINT "MailerWorkers_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

CREATE TABLE "MailerAssoListsWorkers"
(
  _id uuid NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "listId" uuid NOT NULL,
  "workerId" uuid NOT NULL
)
WITH (
  OIDS=FALSE
);

CREATE TABLE "MailerSubscribers"
(
  _id uuid NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "referenceUuid"  character varying(255),
  "referenceEmail" character varying(255),
  CONSTRAINT "MailerSubscribers_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

CREATE TABLE "MailerAssoListsSubscribers"
(
  _id serial NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "listId" uuid NOT NULL,
  "subscriberId" uuid NOT NULL,
  "disabled" boolean default false
)
WITH (
  OIDS=FALSE
);

CREATE TABLE "MailerTemplates"
(
  _id uuid NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "subject" text,
  "text" text,
  "html" text,
  CONSTRAINT "MailerTemplates_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);


CREATE TABLE "MailerTransactions"
(
  _id uuid NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "listId" uuid NOT NULL,
  "providerId" uuid NOT NULL,
  "providerReferenceUuid" character varying(64),
  "workerId" uuid,
  "userId" integer NOT NULL,
  "templateId" uuid,
  email character varying(255),
  metadata json,
  -- quelques stats
  "sentToProviderDate" timestamp with time zone,
  "sentDate" timestamp with time zone,
  "openedDate" timestamp with time zone,
  CONSTRAINT "MailerTransactions_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

INSERT INTO "MailerProviders" ("_id", "name", "token") VALUES
('00000000-0000-0000-0000-000000000001', 'mailblast', 'y5MS3F4vq9X-g7o328vrZHszYxueSA'),
('00000000-0000-0000-0000-000000000002', 'sendgrid', 'FIXME');
