ALTER TABLE "UsersVideos" ADD COLUMN "lastUpdateClientType"  character varying(32);
ALTER TABLE "UsersVideos" ADD COLUMN "lastUpdateUserUA"  character varying(128); -- usefull ?
ALTER TABLE "UsersVideos" ADD COLUMN "lastUpdateDeviceType" character varying(16);-- tapptic additionnal info (Android, ...)
