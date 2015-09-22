ALTER TABLE "AccessTokens" ADD COLUMN "expirationTimespan" integer;
ALTER TABLE "RefreshTokens" ADD COLUMN "expirationTimespan" integer;
