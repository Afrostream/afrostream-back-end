select avg("rating") as "avgRatings", "name", COUNT("rating") as "nbRatings"
from (select "UsersVideos"."rating", "Videos"."name" from "UsersVideos"
      inner join "Videos" ON "UsersVideos"."videoId" = "Videos"."_id"
      where
        rating is not null and
        rating <> 3 and
	      "dateLastRead" > '{{dateLastReadFrom}}' and
	      "dateLastRead" < '{{dateLastReadTo}}'
      ) as foo
group by "name"
order by "avgRatings" desc, "nbRatings" desc
limit 5