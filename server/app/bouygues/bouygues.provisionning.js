'use strict';

var js2xmlparser = require("js2xmlparser");

var utils = require('./bouygues.utils.js');

/**
 * This file is used for the xml generator
 *
 */
var generateXML = function (name, esm) {
  /*
   * « INIT » pour nouvelle VOD ou « UPDATE » pour mettre à jour des informations d’une VOD existante en catalogue.
   */
  // FIXME: field action: check in DB if init / update
  var action = "INIT";
  /*
   Provisioning d’une VOD avec une date de mise au catalogue dans le futur (de J+1 à J+n)
   =>  utiliser la valeur « false » pour le champ « Priority »
   o Provisioning d’une VOD avec une date de mise au catalogue au jour J 
   => utiliser la valeur « true» pour le champ « Priority »
   o Provisioning d’une VOD avec une date de mise au catalogue dans le passé 
   => garder la date/heure de mise au catalogue et utiliser la valeur « true » pour le champ « Priority »
   */
  // FIXME: depends on dateFrom/dateTo
  var priority = "true";
  //
  // Code de la langue de la version originale. Exemple : « FRA » | ISO 639.2 T
  // FIXME: fra par defaut
  var voLanguage = "FRA";
  /*
   Identifiant de la VOD en majuscules sans aucun
   caractère spécial : [a-zA-Z0-9_].
   unique string (15)
   */
  var contentID = 'episode_'+esm.episode.get('_id');
  /*
   REFERENCE : Identifiant de la VOD en majuscules
   aucun caractère spécial : [a-zA-Z0-9_].
   L'identifiant doit être UNIQUE
   L’identifiant doit commencer par 3 lettres : trigramme dédié à la boutique (fourni en début de
   projet à l’EDITEUR par BOUYGUES TELECOM)
   unique string (20)
   */
  // FIXME: trigramme ?
  var contentName = 'AFR_episode_'+esm.episode.get('id');
  /*
   String(20)
   /!\ La valeur à paramétrer dans le fichier est UTF-8 Mais seuls les caractères ISO-8859-1 standard doivent être utilisés.
   ex: " => &#34;
   */
  // FIXME
  var shortTitle = '';
  /*
   String(70)
   Dans le cas d’une série, le titre de l’épisode doit respecter scrupuleusement la nomenclature suivante:
      Nom de la série - SXY Ep AB
   Où XY et AB sont composés de deux digits
   Exemples :
    TitreDeLaSérie - S01 Ep 01
    TitreDeLaSérie - S01 Ep 15
   /!\ La valeur à paramétrer dans le fichier est UTF-8 Mais seuls les caractères ISO-8859-1 standard doivent être utilisés.
   ex: " => &#34;
   */
  // FIXME + verifier les pbs d'encoding
  var title = 'abcde - ééé ["#]';

  /*
   * String(300) Résumé court
   */
  // fixme
  var shortSummary = '';
  /*
   * String (800) Résumé complet
   */
  // fixme
  var longSummary = '';

  /*
   * String (255) Sur la boutique ce champ est utilisé pour affichage
   * du prix de la VOD dans la boutique et dans la fiche
   * produit. L’utilisation initiale a été détournée afin de
   * permettre au partenaire de spécifier un prix promo
   * (lorsque le contenu est en promo). (Voir les
   * spécifications ci-dessous.)
   *
   * Le prix habituel de la VOD est compris dans cette balise dont l’usage initial a été détourné.
   * Respecter la spécification décrite ci-dessous :
   * Spécification du tarif
   *   Cas d’une boutique avec une fiche produit d’un contenu SD
   *    - Le tarif est spécifié en centimes d’euro (exemple : « 325 » pour 3,25 euro)
   *    - 1 type de groupe : « prix_sd »
   *    - Structuration : « type_graoupe:prix_normal »
   *    Exemple d’une VOD SD à 3,20 euro : prix_sd:320
   *   Cas d’une boutique avec une fiche produit d’un contenu HD ou Super HD
   *    - Le tarif est spécifié en centimes d’euro (exemple : « 325 » pour 3,25 euro)
   *    - 1 type de groupe : « prix_hd »
   *    - Structuration : « type_groupe:prix_normal »
   *    Exemple d’une VOD HD à 3,20 euro : prix_hd:320
   *   Cas d’une boutique avec une fiche produit d’un contenu 3D
   *    - Le tarif est spécifié en centimes d’euro (exemple : « xxx » pour x,xxeuro)
   *    - 1 type de groupe : « prix_3D »
   *    - Structuration : « type_groupe:prix_normal»
   *    Exemple d’une VOD 3D à 4,99 euro : prix_3D:499
   *   Cas d’une boutique avec fiche produit multi-format unifiée (une seule fiche pour  contenu en SD et en HD) :
   *    - Le tarif est spécifié en centimes d’euro (exemple : « 325 » pour 3,25 euro)
   *    - 2 groupes de tarifs (SD et HD) séparés par « | »
   *    - 2 types de groupes : « prix_sd » ou « prix_hd »
   *    - Structuration d’un groupe : « type_groupe:prix_normal
   *    Exemple d’une VOD SD à 2 euro accompagnée d’une version HD à 3 euro : prix_sd:200|prix_hd:300
   * Gestion des promotions
   * En cas de promotion d’un contenu, le prix du champ comment ne doit pas être modifié : il faut
   *  garder le prix usuel. Seul le prix facturé défini via l’item PriceInCurrencies doit être modifié.
   * Le champ commentaire permet donc à la boutique de connaitre le prix usuel du contenu pour
   *  pouvoir afficher : « X euros au lieu de X étant renseigné via le tag PriceInCurrencies
   *  et Y via le champ commentaire
   */
  // fixme
  var comment = '';

  /*
   * keyword: String(25) Liste de 1 à 10 mots clefs contenant chacun un seul mot sans espaces.
   * Informations non utilisées dans la boutique flash.
   * Le premier est obligatoire.
   */
  // fixme: 1er est obligatoire
  var keywords = [];

  /*
   * String(50) Pays de production.
   */
  var productionNationality = '';

  /*
   Année de production.
   4 digits
   */
  // FIXME
  var productionDate = "2000";
  /*
   ISO 8601 Std, Durée de la VOD formattée, ex: PT1H40M00S
   */
  // fixme
  var approximateDuration = "";


  /*
   * Rattachement à la rubrique, liste des identifiants de 1 à 6 genres rattachés à la VOD.
   * - Les références associent 3 groupes : [A-Z0-9]{1,3}-[0-9][0-9][0-9]-[0-9][0-9][0-9]
   * - 1er groupe : « 000 » pour les genres communs ou le trigramme du
   *    indiquer un genre privé défini spécifiquement pour le partenaire
   * - 2nd groupe : identifiant du genre
   * - 3ème groupe : identifiant du sous-genre, autrement « 000 » pour
   */
  // fixme: mapping entre nos genres & les genres bouygues.
  // fixme: 6 genres max
  // fixme: attendre le retour de bouygues pour les genresl
  var genres = [];


  var artistItems = [
    {
      /*
       * Prénom de l’artiste associé.
       * String(32)
       */
      // fixme
      artistFirstName : '',
      /*
       * Prénom de l’artiste associé.
       * String(32)
       */
      // fixme
      artistLastName : '',
      /*
       * rôle de l'artist
       * Fonction de l’artiste, plusieurs valeurs possibles :
       - « DIR » : directeur
       - « ACT » : acteur
       - « AUT » : auteur
       - « PRE » : présentateur
       - « PRO » : producteur
       - « MES » : directeur de casting
       - « CHO » : chorégraphe
       */
      // fixme
      artistRole: ''
    }
  ];

  /*
   Obligatoire Public autorisé, plusieurs valeurs possibles :
   - « CSA_1 » : tous publics
   - « CSA_2 » : 10 ans et plus
   - « CSA_3 » : 12 ans et plus
   - « CSA_4 » : 16 ans et plus
   - « CSA_5 » : 18 ans
   */
  // FIXME: /!\ OBLIGATOIRE
  var parentalGuidance = 'CSA_4';


  var images = [
    {
      /*
       Images: Noms des 1 à 10 fichiers images fournis avec la VOD.
       Le premier fichier listé est sélectionné pour la jaquette.
       les 2 premières jacquettes sont obligatoires
       */
      // fixme: 10 fichiers images max, 1er est la jaquette
      /*
       filename String(40)
       */
      // fixme
      originalFilename: '',
      /*
       image type Catégorise l’utilisation de l’image :
       COVER_1 pour jaquette (petit format) 150x200  24bit, 300ko max
       COVER_4 pour jaquette (moyen format) 372x496  24bit, 350ko max
       COVER_5 pour jaquette (grand format) 600x800  24bit, 500ko max
       le type doit être unique
       les images doivent être en jpeg non progressif
       */
      // fixme /!\ 2 jacquettes obligatoires
      type: 'COVER_1'
    }
  ];

  // FIXME loop for artistItem, Genre, Images


  /*
      SERIES
   - Le conteneur de série doit être provisionné avec un ContentName qui sera réutilisé
   au moment de l’ingestion de chacun des épisodes (via le SeriesName)
   - Chaque épisode doit faire référence au conteneur de la série grâce à la balise
   SeriesName dont le contenu doit être égal au ContentName du conteneur de série
   - L’ingestion du conteneur de la série doit se réaliser avec un visuel de présentation de la série + un résumé
   - Les épisodes doivent donc être ingérés après le conteneur de la série.
   - Chaque épisode doit être ingéré notamment avec son propre résumé et son propre visuel.
   - Le titre de l’épisode doit respecter scrupuleusement la nomenclature suivante : Nom de la série - SXY Ep AB
   Où XY et AB sont composés de deux digits
   Exemples :
      TitreDeLaSérie - S01 Ep 01
      TitreDeLaSérie - S01 Ep 15
   */
  /*
   * String : SERIES|EPISODE
   */
  // fixme:
  var seriesType = 'SERIES';
  /*
   SeriesName (String 20)
   Permet de rattacher l’épisode au conteneur de la série correspond au ContentName du conteneur de la série
   S’assurer de bien utiliser le contentName sous lequel le conteneur de la série a été déclaré.
   */
  // fixme: doit etre identique au contentName de la serie correspondante
  var seriesName = '';

  /*
   * 2 Digits, Indique le numéro de saison de l’épisode
   * Utiliser impérativement 2 digits : de 01 à
   */
  // fixme
  var seasonNumber = '01';
  /*
   * 2 Digits, Indique le numéro d’épisode dans la saison
   * Utiliser impérativement 2 digits : de 01 à
   */
  // fixme: episode > 99
  var episodeNumber = '01';



  /*
   Obligatoire. Permet de spécifier l’éligibilité d’un contenu à une promotion (découverte ou non).
   Si non spécifié : "true" par défaut
   Les contenus CSA_5 ou pouvant heurter la sensibilité de certains clients doivent impérativement être  positionnés à "false"
   */
  // fixme
  var promotionAllowed = "true";
  /*
   Permet de définir l’exclusivité du contenu dans le catalogue. "false" par défaut.
   */
  // fixme
  var exclusivity = "false";
  /*
   String(50) : Permet d’indiquer l’ayant-droit correspondant au contenu provisionné.
   ex: sony ?
   */
  // fixme
  var rightsHolder = "";


  /*
   * String(40)  Nom du partenaire (non exploité).
   */
  // fixme
  var contentProviderName = "";

  /*
   * String(20) Nom du sous-répertoire de stockage sur SMV. De préférence identique au « ContentID ».
   */
  // fixme
  var directory = "";

  /*
   * Datetime GMT+1 / Date de suppression du contenu de SMV, exemple : 2025-01-01T00:00:00+01:00
   *
   * Date de suppression des fichiers sur la plate-forme : la date doit être strictement postérieure à
   *  date de fin de mise au catalogue : AvailableEndDate (i.e. elles ne peuvent être identiques)
   * En pratique, pour ne pas surcharger la plateforme il est recommandé de positionner une
   *  DateExpiration à J+1 de la date de fin de catalogue AvailableEndDate.
   */
  // fixme
  var dateExpiration = '';

  /*
   * Engage l’encryption de la VOD.
   */
  // fixme
  var scrambling = "false";

  /*
   * Indique si Macrovision est utilisé.
   */
  // fixme
  var macrovision = "false";

  /*
   * Demande la validation d’un administrateur avant la prise en compte dans le catalogue VOD.
   */
  // fixme
  var adminValidation = "false";

  /*
   * STREAMING|STREAMING_SD|STREAMING_HD|RENTAL_VOD|RENTAL_VOD_HD
   * Obligatoire. Spécifie le type de location utilisé.
   * Attention : la valeur du paramètre serviceName dépend de la version et du type de la boutique instanciée.
   * Dans le cas d’une fiche produit multi-format SD / HD / Super HD unifiée, le nœud DisplayMode doit être présent 2 fois :
   * - 1 fois avec le serviceName RENTAL_VOD
   * - 1 fois avec le serviceName RENTAL_VOD_HD
   * Dans le cas d’une fiche produit 3D, le nœud DisplayMode doit être présent 1 fois avec le serviceName RENTAL_VOD_HD
   */
  // fixme
  var displayModeServiceName = "RENTAL_VOD";

  /*
   * Datetime GMT+1 / Date de mise au catalogue général,exemple : 2010-01-01T00:00:00+01:00
   *
   * Indiquer une période de publication démarrant après la date courante et finissant avant la valeur
   *  de « DateExpiration » ou les fichiers seront définitivement supprimés.
   * AvailableStartDate doit être strictement antérieure à AvailableEndDate (ie elles ne peuvent être identiques)
   */
  // fixme
  var displayModeAvailableStartDate = '';

  /*
   * Datetime GMT+1 / Date de mise au catalogue général, exemple : 2015-01-01T00:00:00+01:00
   */
  // fixme
  var displayModeAvailableEndDate = '';

  /*
   * Digits(2) Durée de validité de la location (en heure)
   * Permet d’indiquer la durée de location du contenu (pour les contenus accessibles via location à l’acte)
   */
  var displayModeRentalDuration = '00';

  /*
   * Digits Obligatoire. Attribut « price » pour le prix  facturé du service Exemple :  7.99 pour 7,99 €
   *
   * Permet d’indiquer le prix utilisé pour la facturation par BOUYGUES TELECOM dans le cas d’une location à l’acte.
   * ATTENTION : en cas de promotion le prix facturé doit être modifié via cet attribut (mais la balise
   * commentaire « comment » qui contient le prix usuel du contenu ne doit pas
   */
  var displayModePrice = '0.00';

  /*
   * Valeur obligatoire.
   */
  var allowTerminal = 'STB'; // mandatory

  /*
   * Disponiblité du contenu au catalogue général
   */
  var vodCatalog = '';

  var packageItems = [
    {
      /*
       * Alphanumérique 30, label Identifiant/Nom du package SVOD auquel est rattaché le contenu
       * fourni par Bouygues Telecom
       */
      label: '',
      /*
       * Datetime GMT+1 : Date de mise au catalogue SVOD
       * Indiquer une période de publication dans le pack ou la SVOD démarrant après la date courante et
       *  finissant avant la valeur de « DateExpiration » ou les fichiers seront définitivement supprimés.
       * PackageItem startDate doit être strictement antérieure à PackageItem endDate (ie elles ne peuvent être identiques)
       */
      startDate: '',
      /*
       * Datetime GMT+1 : Fin de date de mise au catalogue SVOD
       * Indiquer une période de publication dans le pack ou la SVOD démarrant après la date courante et
       *  finissant avant la valeur de « DateExpiration » ou les fichiers seront définitivement supprimés.
       * PackageItem startDate doit être strictement antérieure à PackageItem endDate (ie elles ne peuvent être identiques)
       */
      endDate: '',
      /*
       * STREAMING|STREAMING_SD|STREAMING_HD|RENTAL_VOD|RENTAL_VOD_HD
       */
      serviceName: '',
      /*
       Obligatoire. Attribut « price »
       pour le prix  facturé du service au sein
       d’un pack ou SVOD en plus du pack ou
       de l’abonnement SVOD. Exemple :  7.99
       pour 7,99 €
        - Cas 1 HD ou SD seul | Ancienne boutique | RENTAL_VOD
        - Cas 2 3D ou HD seul | Casino Royale | RENTAL_VOD_HD (à partir de début 2013)
        - Cas 3 HD + Super HD | Casino Royale | RENTAL_VOD_HD (à partir de début 2013)
        - Cas 4 SD + HD | Casino Royale | RENTAL_VOD & RENTAL_VOD_HD
        - Cas 5 SD + HD + Super | Casino Royale | RENTAL_VOD & RENTAL_VOD_HD
       */
      price: '0.00'
    }
  ];

  /*
   * SD | HD | Super HD
   * Définition vidéo standard ou haute.
   *  Les contenus 3D doivent être provsionnés avec l’attribut « HD ».
   */
  var vodVideoDefinition = "SD";
  var trailerVideoDefinition = "SD";

  /*
   * MPEG2 | H264
   * Format d’encodage vidéo.
   */
  var vodVideoFormat = "H264";
  var trailerVideoFormat = "H264";

  /*
   * 16:9 | 4:3
   * Ratio d’image vidéo.
   */
  var vodAspectRatio = '16:9';
  var trailerAspectRatio = '16:9';

  /*
   * Optionnel: “3D-SD”, “VOST”, or empty
   * Précision contenu vidéo
   * Uniquement pour les contenus 3D ou VOST avec
   * sous-titres incrustés
   */
  var tag = "";

  /*
   * audioTrack order
   */


  // FIXME: Questions
  // - champ commentaire pour le prix vide
  // - episode > 99 ?
  // - durée VOD est elle obligatoire ?
  // - promotionAllowed : false, exclusivity: false ?
  // - rightsholder: nos licensors ?
  // - aspectRatio 16:9 / 4:3
  // - videoformat H264 ?

  // FIXME: Saisie supplémentaire backo
  // - [MANDATORY] voLanguage
  // - [MANDATORY] CSA ?
  // - manque des artistes (producteurs, etc)
  // - durée VOD
  // - productionDate

  var data = {
    "@": {
      "xmlns:PCCAD_CD": "urn:PCCAD:CD:schema",
      "xmlns:PCCAD_TV": "urn:PCCAD:TVLocation:schema",
      "xmlns:PCCAD_VOD": "urn:PCCAD:VOD:schema",
      "xmlns:PCCAD_gc": "urn:PCCAD:GC:schema",
      "xmlns:PCCAD_st": "urn:PCCAD:ST:schema",
      "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "name": name,
      "action": action,
      "xmlAutoProvisioning": "true", // pour prise en provisionning immédiat (default=true), ne pas modifier.
      "priority": "true",            //
      "schemaVersion": "2.5",
      "xsi:noNamespaceSchemaLocation": "SchemaW3CPCCAD_SC.xsd"
    },
    "ContentTable": {
      "PCCAD_CD:Content": {
        "@": {
          "voLanguage": voLanguage,
          "contentID": contentID,
          "contentName": contentName
        },
        "PCCAD_CD:ContentDescription": {
          "PCCAD_CD:Title": {
            "PCCAD_CD:ShortTitle": shortTitle,
            "PCCAD_CD:Value": title
          },
          "PCCAD_CD:Summary": {
            "PCCAD_CD:ShortSummary": shortSummary,
            "PCCAD_CD:LongSummary": longSummary
          },
          "PCCAD_CD:Comment": comment, // utilisé pour le prix
          "PCCAD_CD:keywords": {
            "PCCAD_CD:Keyword": keywords.map(function (keyword) {
              return {
                "#": keyword
              };
            })
          },
          "PCCAD_CD:ProductionNationality": productionNationality
        },
        "PCCAD_CD:ProductionDate": productionDate,
        "PCCAD_CD:ApproximateDuration": approximateDuration,
        "PCCAD_CD:GenreList": {
          "PCCAD_CD:Genre": genres.map(function (genre) {
            return {
              "#": genre
            };
          })
        },

        "PCCAD_CD:ArtistList": {
          "PCCAD_CD:ArtistItem": artistItems.map(function (artistItem) {
            return {
              "PCCAD_CD:FirstName": artistItem.artistFirstName,
              "PCCAD_CD:LastName": artistItem.artistLastName,
              "PCCAD_CD:Role": artistItem.artistRole
            };
          })
        },

        "PCCAD_CD:ParentalGuidance": {
          "@": {
            "CSA": parentalGuidance
          }
        },

        "PCCAD_CD:RelatedMaterial": {
          "PCCAD_CD:Image": images.map(function (image) {
            return {
              "@": {
                "originalFilename": image.originalFilename,
                "type": image.type
              }
            };
          })
        },

        /////////////////////// series ////////////////////


        "PCCAD_CD:SeriesType": (
          seriesType === 'SERIES' ?
            // 1er cas: saison
            ({
              "@": {
                "type": "SERIES"
              }
            }) :
            // 2nd cas: episode
            ({
              "@": {
                "type": "EPISODE"
              },
              "PCCAD_CD:SeriesIdentifiant": {
                "PCCAD_CD:SeriesName": seriesName
              },
              "PCCAD_CD:SeasonNumber": seasonNumber,
              "PCCAD_CD:EpisodeNumber": episodeNumber
            })
        ),

        "PCCAD_CD:PromotionAllowed": promotionAllowed,
        "PCCAD_CD:Exclusivity": exclusivity,
        "PCCAD_CD:RightsHolder": rightsHolder
      }
    },

    "ContentLocationTable": {
      "VODContentLocation": {
        "PCCAD_VOD:ContentProvider": {
          "@": {
            "name": contentProviderName
          }
        },
        "PCCAD_VOD:Instructions": {
          "PCCAD_VOD:Directory": directory,
          "PCCAD_VOD:DateExpiration": {
            "@": {
              "xmlns:PCCAD_cl": "urn:PCCAD:CL:schema"
            },
            "#": dateExpiration
          },
          "PCCAD_VOD:Scrambling": scrambling,
          "PCCAD_VOD:Macrovision": macrovision,
          "PCCAD_VOD:AdminValidation": adminValidation,
          "PCCAD_VOD:DisplayMode": {
            "@": {
              "xmlns:PCCAD_cl": "urn:PCCAD:CL:schema",
              "serviceName": displayModeServiceName
            },
            "PCCAD_VOD:AvailableStartDate": displayModeAvailableStartDate,
            "PCCAD_VOD:AvailableEndDate": displayModeAvailableEndDate,
            "PCCAD_VOD:RentalDuration": displayModeRentalDuration,
            "PCCAD_VOD:PriceInCurrencies": {
              "@": {
                "price": displayModePrice
              }
            }
          },
          "PCCAD_VOD:AllowTerminal": "STB", // obligatoire
          "PCCAD_VOD:VodCatalog": vodCatalog,
          "PCCAD_VOD:PackageList": {
            "PCCAD_VOD:PackageItem": packageItems.map(function (packageItem) {
              return {
                "@": {
                  "label": packageItem.label,
                  "startDate": packageItem.startDate,
                  "endDate": packageItem.endDate
                },
                "PCCAD_VOD:PriceCurrency": {
                  "@": {
                    "serviceName": packageItem.serviceName,
                    "price": packageItem.price
                  }
                }
              };
            })
          }
        },
        "PCCAD_VOD:AVAttributes": {
          "@": {
            "estimatedPopularity": "1" // valeur obligatoire
          },
          "PCCAD_CD:VideoAttributes": {
            "@": {
              "videoDefinition": vodVideoDefinition,
              "videoFormat": vodVideoFormat,
              "aspectRatio": vodAspectRatio
            }
          },
          "PCCAD_CD:AudioAttributes": {
            "PCCAD_CD:AudioTrack": {
              "@": {
                "xmlns:PCCAD_cl": "urn:PCCAD:CL:schema",
                "order": "[#AUDIOTRACK_ORDER]",
                "language": "[#AUDIOTRACK_LANGUAGE]"
              }
            }
          },
          "PCCAD_VOD:OriginalFilename": "[#FILE]",
          "PCCAD_VOD:Ts_rate_bit_s": "",
          "PCCAD_VOD:Duration": "[#DURATION]"
        },
        "PCCAD_VOD:Trailer": {
          "@": {
            "estimatedPopularity": "1" // valeur obligatoire
          },
          "PCCAD_CD:VideoAttributes": {
            "@": {
              "videoDefinition": trailerVideoDefinition,
              "videoFormat": trailerVideoFormat,
              "aspectRatio": trailerAspectRatio
            }
          },
          "PCCAD_CD:Tag": tag,
          "PCCAD_CD:AudioAttributes": {
            "PCCAD_CD:AudioTrack": {
              "@": {
                "xmlns:PCCAD_cl": "urn:PCCAD:CL:schema",
                "order": "[#AUDIOTRACK_ORDER]",
                "language": "[#AUDIOTRACK_LANGUAGE]"
              }
            }
          },
          "PCCAD_CD:MediaAttributes": {
            "PCCAD_CD:MediaTrack": {
              "PCCAD_CD:SubTitle": "FRA"
            }
          },
          "PCCAD_VOD:OriginalFilename": "[#FILE]",
          "PCCAD_VOD:Ts_rate_bit_s": "[#BITRATE]",
          "PCCAD_VOD:Duration": "[#DURATION]"
        } // PCCAD_VOD:Trailer
      } // VODContentLocation
    } // ContentLocationTable
  };

  return js2xmlparser('PCCAD_GRID', data);
};

// need a table ExportBouygues
//
//     contentId, contentType, xmlCreation, xmlUpdate, createdAt, updatedAt, metadata
// ex: 668      , "episode"  ,
//
//

module.exports.generateXML = generateXML;