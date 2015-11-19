-- adding new column encodingId (plateform video UUID, 16 char).
ALTER TABLE "Videos" ADD COLUMN "encodingId" character varying(16); -- NOT NULL DEFAULT ''::character varying;

-- updating Videos.encodingId with current data
UPDATE "Videos" as v
SET
    "encodingId" = subquery."encodingId"
FROM
(
  SELECT
    SUBSTRING(a.src, '\/([0-9a-f]{16})(-ter)?.ism') as "encodingId",
    v._id                                           as "videoId"
  FROM
    "Assets" as a
  INNER JOIN
    "Videos" as v ON a."videoId" = v."_id"
) AS subquery
WHERE v._id = subquery."videoId";