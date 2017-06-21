DROP TABLE "MailerLists";
DROP TABLE "MailerProviders";
DROP TABLE "MailerAssoListsProviders";
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
  "numberOfSubscribers" integer default 0,
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
  interface character varying(255), -- name of the pApi interface
  -- flag to stop disable a provider globaly
  "disabled" boolean default false,
  -- quota
  "quotaEmailsBy24H" integer default 0,
  "quotaNbSubscribers" integer default 0,        -- total number of subscribers in the lists
  "quotaNbSubscribersByList" integer default 0,
  -- capabilities
  "canHandleList"  boolean default false,
  CONSTRAINT "MailerProviders_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

CREATE TABLE "MailerAssoListsProviders"
(
  _id uuid NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  "listId" uuid NOT NULL,
  "providerId" uuid NOT NULL,
  -- flags
  automation integer default 0,         -- number of email sent when a subscriber is attached to the provider list
  "canReactive" boolean DEFAULT false,  -- reactive=false => switch => active => unsubscribe =X=> active is forbidden.
  --
  "pApiId" character varying(255),
  "pApiStatus" json,
  CONSTRAINT "MailerAssoListsProviders_pkey" PRIMARY KEY ("listId", "providerId")
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
  "workerId" uuid NOT NULL,
  CONSTRAINT "MailerAssoListsWorkers_pkey" PRIMARY KEY ("listId", "workerId")
)
WITH (
  OIDS=FALSE
);

CREATE TABLE "MailerAssoListsSubscribers"
(
  _id uuid NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  -- we never remove a subscriber
  -- we disable the subscriber
  "disabled" boolean default false,
  "state" character varying(16),
  "dateActive" timestamp with time zone,
  "dateUnsubscribed" timestamp with time zone,
  --
  "listId" uuid NOT NULL,
  "subscriberId" uuid NOT NULL,
  -- a transaction (email sent to provider) already exist for this user.
  "transactionId" uuid,
  CONSTRAINT "MailerAssoListsSubscribers_pkey" PRIMARY KEY ("listId", "subscriberId")
)
WITH (
  OIDS=FALSE
);

CREATE TABLE "MailerSubscribers"
(
  _id uuid NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  -- we never remove a subscriber
  -- we disable the subscriber
  "state" character varying(16),
  -- reference
  "referenceType"  character varying(32),  -- type: backo
  "referenceUuid"  character varying(64),  -- uuid = backoUserId
  "referenceEmail" character varying(255), -- if exists => we use this.
  CONSTRAINT "MailerSubscribers_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

--
-- we need to handle the email provider state here ...
--
CREATE TABLE "MailerAssoListsSubscribersProviders"
(
  _id uuid NOT NULL,
  "createdAt" timestamp with time zone,
  "updatedAt" timestamp with time zone,
  -- links
  "listId" uuid NOT NULL,
  "subscriberId" uuid NOT NULL,
  "providerId" uuid NOT NULL,
  --
  "pApiId" character varying(64),
  "pApiState" character varying(64),
  --
  "state" character varying(16),
  "dateActive" timestamp with time zone,
  "dateUnsubscribed" timestamp with time zone,
  "disabled" boolean default false,
  CONSTRAINT "MailerAssoListsSubscribersProviders_pkey" PRIMARY KEY ("subscriberId", "providerId")
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
  "providerId" uuid NOT NULL,
  "listId" uuid,
  "subscriberId" uuid NOT NULL,
  "subscriberReferenceUuid" character varying(64),
  "subscriberReferenceEmail" character varying(255),
  "templateId" uuid,
  -- quelques stats
  "openedDate" timestamp with time zone,
  CONSTRAINT "MailerTransactions_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

INSERT INTO "MailerProviders"
  ("_id", "name", "token", "interface", "canHandleList", "quotaEmailsBy24H", "quotaNbSubscribers", "quotaNbSubscribersByList")
VALUES
  ('00000000-0000-0000-0000-000000000001', 'mailblast', 'y5MS3F4vq9X-g7o328vrZHszYxueSA', 'Mailblast', true, 50000, 150000, null),
  ('00000000-0000-0000-0000-000000000002', 'sendgrid', 'FIXME', 'Sendgrid', false, 0, 0, 0);
