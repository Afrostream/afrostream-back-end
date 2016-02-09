-- ALTER TABLE "Users" DROP COLUMN bouygues;
ALTER TABLE "Users" ADD COLUMN bouygues json;

-- List of fields to be validated when a user is created
-- ALTER TABLE "Clients" DROP COLUMN "type";
ALTER TABLE "Clients" ADD COLUMN "type" character varying(32);