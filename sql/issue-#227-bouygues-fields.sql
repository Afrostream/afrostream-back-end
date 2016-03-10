 -- pays de production
ALTER TABLE "Movies" ADD COLUMN "productionCountry" character varying(64);
 -- CSA
ALTER TABLE "Movies" ADD COLUMN "CSA" integer;
ALTER TABLE "Episodes" ADD COLUMN "CSA" integer;