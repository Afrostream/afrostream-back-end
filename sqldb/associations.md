# LIAISON 1-1 (belongsTo)
## V2

```
ElementCategory -> Item              foreignKey:_id
ElementEpisode  -> Item              foreignKey:_id
ElementEpisode  -> ElementSeason
ElementEpisode  -> Licensor
ElementFilm     -> Item              foreignKey:_id
ElementLive     -> Item              foreignKey:_id
ElementPerson   -> Item              foreignKey:_id
ElementSeason   -> Item              foreignKey:_id
ElementSeason   -> ElementSerie
ElementSerie    -> Item              foreignKey:_id
ElementSerie    -> Licensor
Item            -> ElementCategory   foreignKey:_id
Item            -> ElementEpisode    foreignKey:_id
Item            -> ElementFilm       foreignKey:_id
Item            -> ElementLive       foreignKey:_id
Item            -> ElementPerson     foreignKey:_id
Item            -> ElementSeason     foreignKey:_id
Item            -> ElementSerie      foreignKey:_id
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
Comment         -> Movie
Comment         -> Video
Episode         -> Season
Episode.poster  -> Image
Episode.thumb   -> Image
Episode         -> Video
Episode         -> CatchupProvider
Log             -> User
Log             -> Client
Movie           -> Licensor
Movie -> CatchupProvider
Movie.poster -> Image
Movie.logo -> Image
Movie.thumb -> Image
Movie.video -> Video
Post.poster -> Image
Press.pdf -> Image
Press -> Image
Season->Movie
Season.poster -> Image
Season.thumb -> Image
Season -> CatchupProvider
UsersVideos -> Video
UsersVideos -> User
Video -> CatchupProvider
VideosComments -> Video
VideosComments -> User
Widget -> Image
WallNote        -> User
```

# Liaisons 1-N (hasMany)
## V2

```
ElementSeason.elementEpisodes[] -> ElementEpisode
ElementSerie.elementSeasons[] -> ElementSeason
```

## V1

```
User.lifePins[] -> LifePin
Licensor.movies[] -> Movie
Movie.comments[] -> Comment
Movie.tags[] -> Tag
Movie.seasons[] -> Season
Season.episodes[] -> Episode
Video.captions[] -> Caption
```

# Liaonsns N-N (belongsToMany)
## V2
```
ElementCategory.items[]  -> AssoItemsCategories -> Item
Item.elementCategories[] -> AssoItemsCategories -> ElementCategory
```
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
