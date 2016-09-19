ALTER TABLE "Users" ADD COLUMN "telephone"               character varying(16);
ALTER TABLE "Users" ADD COLUMN "birthDate"                 timestamp with time zone;
ALTER TABLE "Users" ADD COLUMN "gender"                    character varying(16);
ALTER TABLE "Users" ADD COLUMN "nationality"               character varying(2);

ALTER TABLE "Users" ADD COLUMN "languageId"                integer;

ALTER TABLE "Users" ADD COLUMN "postalAddressCountry"      character varying(2);
ALTER TABLE "Users" ADD COLUMN "postalAddressLocality"     character varying(32);
ALTER TABLE "Users" ADD COLUMN "postalAddressRegion"            character varying(8);
ALTER TABLE "Users" ADD COLUMN "postalAddressCode"              character varying(16);
ALTER TABLE "Users" ADD COLUMN "postalAddressCity"              character varying(64);
ALTER TABLE "Users" ADD COLUMN "postalAddressStreet"            character varying(64);

ALTER TABLE "Users" ADD COLUMN "jobTitle"                       character varying(32);

ALTER TABLE "Users" ADD COLUMN "playerCaption"                  character varying(3);
ALTER TABLE "Users" ADD COLUMN "playerAudio"                    character varying(3);
ALTER TABLE "Users" ADD COLUMN "playerQuality"                  integer;
ALTER TABLE "Users" ADD COLUMN "playerAutoNext"                 boolean;
ALTER TABLE "Users" ADD COLUMN "playerKoment"                   boolean;

ALTER TABLE "Users" ADD COLUMN "subscriptionSource"             character varying(32);

ALTER TABLE "Users" ADD COLUMN "emailOptIn"                     boolean default true;
ALTER TABLE "Users" ADD COLUMN "emailNewsletter"                boolean;

ALTER TABLE "Users" ADD COLUMN "avatarImageId"                  uuid;
ALTER TABLE "Users" ADD COLUMN "socialSharing"                  boolean;


ALTER TABLE "UsersVideos" ADD COLUMN "playerQuality"                  integer;
