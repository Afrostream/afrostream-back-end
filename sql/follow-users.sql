--
DROP TABLE "LifeUsersFollowers";
--
ALTER TABLE "User" ADD COLUMN followers integer DEFAULT 0;
