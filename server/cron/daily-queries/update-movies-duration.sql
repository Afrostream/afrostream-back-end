update "Movies"
set duration = foo.duration
from
(
select "Movies"."_id" as "_id", "Videos"."duration" as duration
from "Movies"
inner join "Videos" on "Movies"."videoId" = "Videos"."_id" and "Videos"."duration" is not null
where "Movies".duration is null and "Movies"."type"='movie'
) as foo
where
"Movies"."_id" = foo."_id"
