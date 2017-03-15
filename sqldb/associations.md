# LIAISON 1-1 (belongsTo)
## V2

```
Film            -> Licensor
Film            -> CatchupProvider
Film.poster     -> Image
Film.logo       -> Image
Film.thumb      -> Image
Film.video      -> Video
Live            -> Licensor
Live            -> CatchupProvider
Live.poster     -> Image
Live.logo       -> Image
Live.thumb      -> Image
Live.video      -> Video
Serie           -> Licensor
Serie           -> CatchupProvider
Serie.poster    -> Image
Serie.logo      -> Image
Serie.thumb     -> Image
Serie.video     -> Video
CategoryElement -> Category
CategoryElement -> Film
CategoryElement -> Live
CategoryElement -> Serie

# backward compatibility
Film            -> Movie
Live            -> Movie
Serie           -> Movie

# Tenants
AccessToken              -> Tenant
Actor                    -> Tenant
Asset                    -> Tenant
AssoItemsCategories      -> Tenant
AuthCode                 -> Tenant
Broadcaster              -> Tenant
Caption                  -> Tenant
CatchupProvider          -> Tenant
CategoryAdSpots          -> Tenant
CategoryElement          -> Tenant
Category                 -> Tenant
CategoryMovies           -> Tenant
Client                   -> Tenant
Comment                  -> Tenant
Config                   -> Tenant
Country                  -> Tenant
Episode                  -> Tenant
Film                     -> Tenant
Genre                    -> Tenant
GiftGiver                -> Tenant
Image                    -> Tenant
Language                 -> Tenant
Licensor                 -> Tenant
LifePin                  -> Tenant
LifeSpot                 -> Tenant
LifeTheme                -> Tenant
LifeThemePins            -> Tenant
LifeThemeSpots           -> Tenant
LifeUsersFollowers       -> Tenant
LifeUsersPins            -> Tenant
Live                     -> Tenant
Log                      -> Tenant
LogsPixel                -> Tenant
Movie                    -> Tenant
MoviesActors             -> Tenant
Notification             -> Tenant
PFGroup                  -> Tenant
PFGroupsProfiles         -> Tenant
PFProfile                -> Tenant
Post                     -> Tenant
Press                    -> Tenant
RefreshToken             -> Tenant
Season                   -> Tenant
Serie                    -> Tenant
Store                    -> Tenant
Tag                      -> Tenant
Tenant                   -> Tenant
User                     -> Tenant
UsersFavoritesEpisodes   -> Tenant
UsersFavoritesMovies     -> Tenant
UsersFavoritesSeasons    -> Tenant
UsersVideos              -> Tenant
Video                    -> Tenant
VideosComments           -> Tenant
WaitingUser              -> Tenant
WallNote                 -> Tenant
WallNotesUsers           -> Tenant
Widget                   -> Tenant
Work                     -> Tenant
```

# V1 - Life

```
LifePin         -> Image
LifePin         -> User
LifeSpot        -> Image
```

# V1

```
AccessToken     -> User
AccessToken     -> Client      targetKey:_id
Actor           -> Image
Broadcaster.defaultCountry     -> Country
Caption.lang    -> Language
CatchupProvider -> Category
CatchupProvider -> Licensor
Client.pfGroup  -> PFGroup
Client          -> Broadcaster
Episode         -> Season
Episode.poster  -> Image
Episode.thumb   -> Image
Episode         -> Video
Episode         -> CatchupProvider
Log             -> User
Log             -> Client
Movie           -> Licensor
Movie           -> CatchupProvider
Movie.poster    -> Image
Movie.logo      -> Image
Movie.thumb     -> Image
Movie.video     -> Video
Post.poster     -> Image
Press.pdf       -> Image
Press           -> Image
Season          -> Movie
Season.poster   -> Image
Season.thumb    -> Image
Season          -> CatchupProvider
UsersVideos     -> Video
UsersVideos     -> User
Video           -> CatchupProvider
VideosComments  -> Video
VideosComments  -> User
Widget          -> Image
WallNote        -> User
```

# Liaisons 1-N (hasMany)
## V2

```
Serie.seasons[] -> Season
# asso category <-> elements
Film.categoryElements[]  -> CategoryElement
Live.categoryElements[]  -> CategoryElement
Serie.categoryElements[] -> CategoryElement
Category.elements[] -> CategoryElement
```

## V1

```
User.lifePins[] -> LifePin
Licensor.movies[] -> Movie
Movie.tags[] -> Tag
Movie.seasons[] -> Season
Season.episodes[] -> Episode
Video.captions[] -> Caption
```

# Liaonsns N-N (belongsToMany)

## V1 - Life
```
LifePin.themes[] -> LifeThemePins -> LifeTheme
LifeTheme.pins[] -> LifeThemePins -> LifePin
LifeSpot.themes[] -> LifeThemeSpots -> LifeTheme
LifeTheme.spots[] -> LifeThemeSpots -> LifeSpot
```
## V1
```
Actor.movies[] -> MoviesActors -> Movie
Movie.actors[] -> MoviesActors -> Actor
Movie.categorys[] -> CategoryMovies -> Category
Category.movies[]  -> CategoryMovies  -> Movie
Category.adspots[] -> CategoryAdSpots -> Movie
User.favoritesEpisodes[] -> UsersFavoritesEpisodes -> Episode
User.favoritesMovies[]   -> UsersFavoritesMovies   -> Movie
User.favoritesSeasons[]  -> UsersFavoritesSeasons  -> Season
```
