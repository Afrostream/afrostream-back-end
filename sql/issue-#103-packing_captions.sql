--
ALTER TABLE "Languages" ADD COLUMN "ISO6392T" character varying(3) NOT NULL DEFAULT ''::character varying;
--
ALTER TABLE "Videos" ADD COLUMN "captionsPackedStatus" character varying(16) NOT NULL DEFAULT 'unpacked'::character varying;
ALTER TABLE "Videos" ADD COLUMN "captionsPackedLastJobId" integer;