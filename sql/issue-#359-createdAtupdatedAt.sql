-- SELECT "tablename" FROM pg_catalog.pg_tables where schemaname='public' order by "tablename" asc;

ALTER TABLE "AccessTokens"                 ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Actors"                       ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Assets"                       ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "AuthCodes"                    ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Broadcasters"                 ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "CacheUsersSubscriptions"      ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Captions"                     ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "CatchupProviders"             ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Categories"                   ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "CategoryAdSpots"              ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "CategoryMovies"               ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Clients"                      ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Comments"                     ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Configs"                      ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Countries"                    ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Episodes"                     ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "ExportsBouygues"              ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "ExportsOCI"                   ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "ExportsOSearch"               ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Genres"                       ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "GiftGivers"                   ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Images"                       ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Languages"                    ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Licensors"                    ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "LifePins"                     ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "LifeSpots"                    ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "LifeThemePins"                ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "LifeThemeSpots"               ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "LifeThemes"                   ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "LifeUsersPins"                ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "LifeUsersPinsLikes"           ADD COLUMN "createdAt" timestamp with time zone;
-- ALTER TABLE "Logs"                         ADD COLUMN "createdAt" timestamp with time zone; -- already exist
ALTER TABLE "Movies"                       ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "MoviesActors"                 ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "PFGroups"                     ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "PFGroupsProfiles"             ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "PFProfiles"                   ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Posts"                        ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Presses"                      ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "RefreshTokens"                ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Seasons"                      ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Stores"                       ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Tags"                         ADD COLUMN "createdAt" timestamp with time zone;
-- ALTER TABLE "Users"                        ADD COLUMN "createdAt" timestamp with time zone; -- already exist
ALTER TABLE "UsersFavoritesEpisodes"       ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "UsersFavoritesMovies"         ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "UsersFavoritesSeasons"        ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "UsersVideos"                  ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Videos"                       ADD COLUMN "createdAt" timestamp with time zone;
-- ALTER TABLE "VideosComments"               ADD COLUMN "createdAt" timestamp with time zone; -- already exist
-- ALTER TABLE "WaitingUsers"                 ADD COLUMN "createdAt" timestamp with time zone; -- already exist
-- ALTER TABLE "WallNotes"                    ADD COLUMN "createdAt" timestamp with time zone; -- already exist
-- ALTER TABLE "WallNotesUsers"               ADD COLUMN "createdAt" timestamp with time zone; -- already exist
ALTER TABLE "Widgets"                      ADD COLUMN "createdAt" timestamp with time zone;
ALTER TABLE "Works"                        ADD COLUMN "createdAt" timestamp with time zone;
--
ALTER TABLE "AccessTokens"                 ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Actors"                       ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Assets"                       ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "AuthCodes"                    ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Broadcasters"                 ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "CacheUsersSubscriptions"      ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Captions"                     ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "CatchupProviders"             ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Categories"                   ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "CategoryAdSpots"              ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "CategoryMovies"               ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Clients"                      ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Comments"                     ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Configs"                      ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Countries"                    ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Episodes"                     ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "ExportsBouygues"              ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "ExportsOCI"                   ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "ExportsOSearch"               ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Genres"                       ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "GiftGivers"                   ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Images"                       ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Languages"                    ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Licensors"                    ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "LifePins"                     ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "LifeSpots"                    ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "LifeThemePins"                ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "LifeThemeSpots"               ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "LifeThemes"                   ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "LifeUsersPins"                ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "LifeUsersPinsLikes"           ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Logs"                         ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Movies"                       ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "MoviesActors"                 ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "PFGroups"                     ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "PFGroupsProfiles"             ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "PFProfiles"                   ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Posts"                        ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Presses"                      ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "RefreshTokens"                ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Seasons"                      ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Stores"                       ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Tags"                         ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Users"                        ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "UsersFavoritesEpisodes"       ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "UsersFavoritesMovies"         ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "UsersFavoritesSeasons"        ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "UsersVideos"                  ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Videos"                       ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "VideosComments"               ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "WaitingUsers"                 ADD COLUMN "updatedAt" timestamp with time zone;
-- ALTER TABLE "WallNotes"                    ADD COLUMN "updatedAt" timestamp with time zone; -- already exist
-- ALTER TABLE "WallNotesUsers"               ADD COLUMN "updatedAt" timestamp with time zone; -- already exist
ALTER TABLE "Widgets"                      ADD COLUMN "updatedAt" timestamp with time zone;
ALTER TABLE "Works"                        ADD COLUMN "updatedAt" timestamp with time zone;


-- recuperation des colonnes de type 'timestamp with time zone' pour un audit manuel
-- SELECT table_name, column_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name  IN (SELECT "tablename" FROM pg_catalog.pg_tables where schemaname='public')
--   and data_type = 'timestamp with time zone'
-- order by "table_name" asc

-- migration des données
UPDATE "AccessTokens" SET "createdAt" = "created" where "created" is not null;
UPDATE "RefreshTokens" SET "createdAt" = "created" where "created" is not null;
