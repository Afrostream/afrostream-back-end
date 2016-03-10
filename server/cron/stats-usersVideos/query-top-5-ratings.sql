select avg("rating") as "avgRatings", "name", "videoId", COUNT("rating") as "nbRatings"
from (select "UsersVideos"."rating", "UsersVideos"."videoId", "Videos"."name" from "UsersVideos"
      inner join "Videos" ON "UsersVideos"."videoId" = "Videos"."_id"
      where
        rating is not null and
        rating <> 3 and
	      "dateLastRead" > '{{dateLastReadFrom}}' and
	      "dateLastRead" < '{{dateLastReadTo}}'
      ) as foo
group by "videoId", "name"
order by "avgRatings" desc, "nbRatings" desc
limit 5