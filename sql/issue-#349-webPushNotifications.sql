ALTER TABLE "Users" ADD COLUMN "webPushNotifications" boolean;
ALTER TABLE "Users" ALTER COLUMN "webPushNotifications" SET DEFAULT true;
