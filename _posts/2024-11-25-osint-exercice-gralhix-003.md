---
layout: post
title:  "OSINT Exercice : Gralhix #003"
date:   2024-11-25
tags:
- osint
description: >
  Solution d'un exercice d'OSINT proposé par Sofia Santos
--- 

## Briefing

→ [Briefing](https://gralhix.com/list-of-osint-exercises/osint-exercise-003/)  

En avril 2017, Mohamed Abdullahi Farmaajo, alors président de la Somalie, s’est rendu en Turquie. Une agence de presse a publié une photo où on le voit serrer la main de Recep Tayyip Erdoğan, le président du pays. L’article ne précise pas où la photo a été prise :

{:.center}
![Briefing]({{ site.url }}/images/osint-exercice-gralhix-003/briefing.jpg)

1. Quel sont le nom et les coordonnées du lieu où la photo a été prise ?

<aside><p>Cet article révèle la solution de l'exercice, n'allez pas plus loin si vous voulez le faire vous-même.</p></aside>

## Résolution

Ne voyant qu'un bâtiment dans la photo, je doute qu'on puisse y récupérer une quelconque information. Je garde tout de même en tête le côté somptueux et les quelques détails qu'on peut distinguer dans les reflets. Cela ne m'apporte rien pour le moment, mais sait-on jamais…

Sans plus de contexte, je commence par faire une recherche inversée sur Google Images. Je trouve de nombreux résultats très similaires, dont un article intitulé "Le Premier ministre albanais Rama au complexe présidentiel" :

{:.center}
![Recherche d'image inversée]({{ site.url }}/images/osint-exercice-gralhix-003/resolution-01.png)

J'accède à [l'article en question](https://www.tccb.gov.tr/fr/actualit-s/1861/151268/le-premier-ministre-albanais-rama-au-complexe-pr-sidentiel), qui se trouve être le site de la Présidence de la République de Türkiye, une source fiable donc (cf l'extension `.gov.tr`). Parmi les photos liées à cet article, on retrouve en effet la même porte, cette fois-ci avec le drapeau de l'Albanie :

{:.center}
![Une autre photo similaire]({{ site.url }}/images/osint-exercice-gralhix-003/resolution-02.jpg)

Une recherche rapide "complexe présidentiel de Turquie" sur Google, et me voilà sur [la page Wikipedia](https://fr.wikipedia.org/wiki/Palais_pr%C3%A9sidentiel_(Turquie)) du palais en question. Les photos confirment qu'il s'agit bien de cet endroit.

En allant voir [sur Google Maps](https://www.google.fr/maps/place/Presidential+Complex+of+Turkey/@39.9306684,32.7980314,683a,35y,337.31h), je trouve très vite sa position :

{:.center}
![Le Complexe Présidentiel de Turquie]({{ site.url }}/images/osint-exercice-gralhix-003/resolution-03.png)

Il me semble être au bout de l'exercice, mais je remarque dans les images que la porte donnant sur l'esplanade (identifiable grâce à la grille, à la peinture rouge au sol et à la route au premier plan) ressemble très fortement à celle donnant sur le jardin (identifiable grâce au bassin d'eau et à la végétation) :

{:.center}
![Les deux portes]({{ site.url }}/images/osint-exercice-gralhix-003/resolution-04.png)

Il semble plus logique de penser qu'il s'agit de la porte de l'esplanade, pour des raisons de place ou de sécurité. C'est le tapis bleu qui m'en convaincra finalement, ce tapis faisant visiblement partie du protocole. Une recherche Google "tapis bleu Erdogan" m'amènera vers un [article de La Presse](https://www.lapresse.ca/international/europe/201411/28/01-4823400-turquie-le-president-erdogan-devoile-son-fastueux-palais.php) indiquant que "les représentants de la presse ont été placés sous stricte surveillance", et que "les visiteurs ont pu admirer […] la gigantesque esplanade dallée de marbre vert, recouverte pour l'occasion d'un long tapis bleu clair".

C'est au final la distinction entre les deux portes qui m'aura pris un peu de temps, mais je suis à présent certain que la photo a été prise depuis l'esplanade du palais.

## Solution

- **Temps passé : 6 minutes**
- **Niveau ressenti : Facile**
- **Partie 1 : [Palais présidentiel, Ankara, 39.931183, 32.799708](https://www.google.fr/maps/place/39%C2%B055'52.2%22N+32%C2%B047'58.9%22E/@39.931183,32.799708,228m)**


## Liens

[Page de l'exercice](https://gralhix.com/list-of-osint-exercises/osint-exercise-003/)      
