ALTER TABLE "AccessTokens" ADD COLUMN "userIp" cidr;
ALTER TABLE "AccessTokens" ADD COLUMN "userAgent" character varying(255);