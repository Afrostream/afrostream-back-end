-- temporary backup
CREATE TABLE "backupMovies" AS TABLE "Movies";

-- updating Movies.videoId with the videoId of the first episode from the first season.
UPDATE "Movies"
SET
  "videoId" = sub."videoId"
FROM
(
-- subquery
SELECT
  m._id as "movieId", e."videoId" as "videoId", m.title, e.title
FROM "Movies" as m
INNER JOIN "Seasons" as s ON s."movieId" = m._id AND s."seasonNumber" = 1
INNER JOIN "Episodes" as e ON e."seasonId" = s._id AND e."episodeNumber" = 1
WHERE m.type = 'serie'
ORDER BY m._id asc
--
) as sub
WHERE _id = sub."movieId"
  AND type = 'serie' -- shouldn't be necessary