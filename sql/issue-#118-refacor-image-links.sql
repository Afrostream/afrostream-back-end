-- first, remove constraints
ALTER TABLE "Images" DROP CONSTRAINT "Images_EpisodeId_fkey";
ALTER TABLE "Images" DROP CONSTRAINT "Images_MovieId_fkey";
ALTER TABLE "Images" DROP CONSTRAINT "Images_SeasonId_fkey";
-- then, remove columns
ALTER TABLE "Images" DROP COLUMN "EpisodeId";
ALTER TABLE "Images" DROP COLUMN "MovieId";
ALTER TABLE "Images" DROP COLUMN "SeasonId";
