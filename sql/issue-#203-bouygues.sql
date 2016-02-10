-- ALTER TABLE "Users" DROP COLUMN "bouyguesId";
ALTER TABLE "Users" ADD COLUMN "bouyguesId" character varying(128);
ALTER TABLE "Users"
  ADD CONSTRAINT "Users_bouyguesId_key" UNIQUE("bouyguesId");

-- List of fields to be validated when a user is created
-- ALTER TABLE "Clients" DROP COLUMN "type";
ALTER TABLE "Clients" ADD COLUMN "type" character varying(32);

-- Associate a billing providerName to a client
-- ALTER TABLE "Clients" DROP COLUMN "billingProviderName";
ALTER TABLE "Clients" ADD COLUMN "billingProviderName" character varying(32);