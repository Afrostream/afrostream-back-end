-- Table: "Genres"
-- DROP TABLE "Genres";
CREATE TABLE "Genres"
(
  _id serial NOT NULL,
  "name" character varying(64),
  "bouyguesIngridName" character varying(32),
  "bouyguesIngridCode" character varying(11),
  CONSTRAINT "Genres_pkey" PRIMARY KEY (_id)
)
WITH (
  OIDS=FALSE
);

INSERT INTO "Genres"
       ("name", "bouyguesIngridName", "bouyguesIngridCode")
VALUES
     ('Action', 'Action - Thriller', 'VAS-010-000'),
     ('Animation', 'Action - Thriller', 'VAS-010-000'),
     ('Aventure', 'Action - Thriller', 'VAS-010-000'),
     ('BET', 'BET', 'VAS-006-000'),
     ('Classique', 'Musical', 'VAS-011-000'),
     ('Comédie', 'Comédie', 'VAS-007-000'),
     ('Comédie dramatique', 'Comédie', 'VAS-007-000'),
     ('Comédie familiale', 'Comédie', 'VAS-007-000'),
     ('Concert', 'Musical', 'VAS-011-000'),
     ('Dessin animé', 'Jeunesse', 'VAS-004-000'),
     ('Divers', 'Tous les films', 'VAS-001-000'),
     ('Documentaire', 'Action - Thriller', 'VAS-010-000'),
     ('Drame', 'Drame', 'VAS-009-000'),
     ('Epouvante', 'Action - Thriller', 'VAS-010-000'),
     ('Espionnage', 'Action - Thriller', 'VAS-010-000'),
     ('Expérimental', 'Action - Thriller', 'VAS-010-000'),
     ('Famille', 'Drame', 'VAS-009-000'),
     ('Fantastique', 'Action - Thriller', 'VAS-010-000'),
     ('Guerre', 'Action - Thriller', 'VAS-010-000'),
     ('Historique', 'Action - Thriller', 'VAS-010-000'),
     ('Horreur', 'Action - Thriller', 'VAS-010-000'),
     ('Jeunesse', 'Jeunesse', 'VAS-004-000'),
     ('Judiciaire', 'Action - Thriller', 'VAS-010-000'),
     ('LGBT', 'Tous les films', 'VAS-001-000'),
     ('Mini-Series', 'Séries', 'VAS-002-000'),
     ('Musical', 'Musical', 'VAS-011-000'),
     ('Péplum', 'Tous les films', 'VAS-001-000'),
     ('Policier', 'Action - Thriller', 'VAS-010-000'),
     ('Romantique', 'Romance', 'VAS-008-000'),
     ('Science-fiction', 'Tous les films', 'VAS-001-000'),
     ('Sport', 'Tous les films', 'VAS-001-000'),
     ('Sport event', 'Spectacles', 'VAS-005-000'),
     ('Suspense', 'Action - Thriller', 'VAS-010-000'),
     ('Thriller', 'Action - Thriller', 'VAS-010-000'),
     ('Tv Show', 'Spectacles', 'VAS-005-000'),
     ('Western', 'Tous les films', 'VAS-001-000');