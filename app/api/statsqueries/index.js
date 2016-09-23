'use strict';

/**

name:
target:
sql:
    select _id, d from (
            select _id, to_char("createdAt", 'YYYY-MM-DD') as d
            from "Users"
            where "ise2" is not null
            ) as foo
    where d = 'DAY'
    order by _id asc;


params:
   %DAY% : { type: 'DAY' l}


CREATE
EDIT
  name: input text
  target: <select>
  sql:  textarea sql highlight
  params:
    name: DAY   TYPE: %%   DEFAULT: NOW
LAUNCH
    DAY       CALENDAR


  poc:
*/
