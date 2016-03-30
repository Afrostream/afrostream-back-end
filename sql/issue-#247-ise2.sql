ALTER TABLE "Users" ADD COLUMN "ise2" character varying(128);

ALTER TABLE "Users"
  ADD CONSTRAINT "Users_ise2_key" UNIQUE("ise2");