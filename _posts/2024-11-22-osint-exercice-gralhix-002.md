---
layout: post
title:  "OSINT Exercice : Gralhix #002"
date:   2024-11-22
tags:
- osint
description: >
  Solution d'un exercice d'OSINT proposé par Sofia Santos
--- 

## Briefing

→ [Briefing](https://gralhix.com/list-of-osint-exercises/osint-exercise-002/)  

Une image partagée sur un réseau social et montrant une gare ferroviaire est fournie :

{:.center}
![Briefing]({{ site.url }}/images/osint-exercice-gralhix-002/briefing.png)

1. Quel est le nom de la gare visible sur la photo ?
2. Quel est le nom et la hauteur de la plus haute structure visible sur la photo ?

<aside><p>Cet article révèle la solution de l'exercice, n'allez pas plus loin si vous voulez le faire vous-même.</p></aside>

## Résolution

Je récupère des informations assez évidentes sur la photo :
- Un panneau "Flinders Street" correspond sans aucun doute au nom de la gare
- La seule langue visible est l'anglais
- 6 structures assez hautes sont visibles en arrière-plan (5 bâtiments et une antenne)
- 2 bâtiments ont une inscription lisible : HWT et IBM
- Un train bleu et gris est présent, avec des inscriptions "METRO" (peut-être coupé) et "FT" ou "PT" (difficile à identifier clairement)

{:.center}
![Premières informations]({{ site.url }}/images/osint-exercice-gralhix-002/resolution-01.png)

Je commence par rechercher ["Flinders Street" sur Google Maps](https://www.google.fr/maps/place/Flinders+St,+Melbourne+VIC,+Australie/@-37.8188319,144.9614845,1287m), et je tombe directement sur une gare à Melbourne. Je peux confirmer que c'est la bonne gare grâce au design des trains (recherche "métro Melbourne"), et en identifiant très vite le bâtiment IBM à quelques mètres sur Google Maps.

{:.center}
![Le Métro de Melbourne]({{ site.url }}/images/osint-exercice-gralhix-002/resolution-02.jpg)

Pour les bâtiments, je veux me focaliser sur les 3 plus grands : 
- (1) L'antenne
- (4) Le bâtiment IBM
- (6) Le bâtiment en fond avec une enseigne rouge 

En regardant sur Google Maps je trouve très vite leur noms : 
- Art Center Melbourne (il s'agissait en fait d'une immense flèche)
- IBM Australia
- FOCUS Apartments

{:.center}
![Les bâtiments visibles]({{ site.url }}/images/osint-exercice-gralhix-002/resolution-03.png)

Une recherche Google “[Arts Centre Melbourne building size](https://www.google.com/search?q=Arts+Centre+Melbourne+building+size)” retourne 162m.

Une recherche “[IBM Australia building size](https://www.google.com/search?q=IBM+Australia+building+size)” retourne 131m, ainsi qu’un site dans les résultats qui pourra m’être utile : [skyscrapercenter.com](https://www.skyscrapercenter.com/building/ibm-australia/13493)

Une recherche “[FOCUS Apartments building size](https://www.google.com/search?q=FOCUS+Apartments+building+size)” retourne 167m, mais remonte le lien [skyscrapercenter.com](https://www.skyscrapercenter.com/building/focus-melbourne/38852) qui indique 166m.

Avec Google Maps en mode 3D (incliné), je confirme que les 3 autres bâtiments sont à ignorer car plus petits. J’aurais pu gagner du temps en faisant ceci dès le début, ce qui m’aurait directement orienté sur le bâtiment de FOCUS.

{:.center}
![Une vue 3D des bâtiments]({{ site.url }}/images/osint-exercice-gralhix-002/resolution-04.png)

## Solution

- **Temps passé : 8 minutes**
- **Niveau ressenti : Facile**
- **Partie 1 : [Gare de Flinders Street, Melbourne](https://www.google.fr/maps/@-37.8179106,144.9660785,3a,75y,160.17h,93.83t/data=!3m7!1e1!3m5!1sNMgsFYpG2J87c-cHB8pYbg!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-3.8346935734046923%26panoid%3DNMgsFYpG2J87c-cHB8pYbg%26yaw%3D160.17430175178856!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI0MTExOC4wIKXMDSoASAFQAw%3D%3D)**
- **Partie 2 : [FOCUS Apartments, 166m](https://www.skyscrapercenter.com/building/focus-melbourne/38852)**


## Liens

[Page de l'exercice](https://gralhix.com/list-of-osint-exercises/osint-exercise-002/)      
