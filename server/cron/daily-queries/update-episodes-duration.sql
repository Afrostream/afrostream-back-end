update "Episodes"
set duration = foo.duration
from
(
select "Episodes"."_id" as "_id", "Videos"."duration" as duration
from "Episodes"
inner join "Videos" on "Episodes"."videoId" = "Videos"."_id" and "Videos"."duration" is not null
where "Episodes".duration is null
) as foo
where
"Episodes"."_id" = foo."_id"
