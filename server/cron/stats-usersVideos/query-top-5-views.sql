select count("UsersVideos"."userId") as "nbUsers", "UsersVideos"."videoId", "Videos"."name" from "UsersVideos" 
      inner join "Videos" ON "UsersVideos"."videoId" = "Videos"."_id" 
      where
	      "dateLastRead" > '{{dateLastReadFrom}}' and
	      "dateLastRead" < '{{dateLastReadTo}}'
      group by "UsersVideos"."videoId", "Videos"."name"
      order by "nbUsers" desc
      limit 5