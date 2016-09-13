-- lors de la livraison
ALTER TABLE "Movies" ADD COLUMN "yearReleased" integer;

-- quelques semaines après livraison
 ALTER TABLE "Movies" DROP COLUMN "dateReleased";
