---
layout: post
title:  "OSINT Exercice : Gralhix #001"
date:   2024-11-21
tags:
- osint
description: >
  Solution d'un exercice d'OSINT proposé par Sofia Santos
--- 

<aside><p>Disclaimer : le but de cette série d'article ne va pas être de vous former à l'OSINT (je n'ai pas assez de compétences), mais de partager ma petite aventure dans ce domaine, en présentant la manière dont j'ai pu résoudre différents exercices.</p></aside>

## C'est quoi l'OSINT ?

Comme il s'agit de mon premier article sur le sujet, présentons quand même rapidement le sujet. 

OSINT est l'acronyme de Open Source INTelligence, soit en français les renseignements de sources ouvertes. C'est une pratique d'investigation pour obtenir une information précise à partir de l'analyse et du croisement de sources de données multiples en libre accès. 

En bref : on vous dissimule une information, et vous la trouvez par un moyen (légal) détourné grâce à de l'open data.

## C'est qui Gralhix ?

Sofia Santos (ou Gralhix) est une analyste OSINT qui propose sur [son site](https://gralhix.com/) une liste d'exercices OSINT pour tous niveaux. Ce sont ces exercices (30 aujourd'hui) que je vais essayer de résoudre petit à petit afin de m'entraîner.

<aside><p>La suite de cet article révèle la solution de l'exercice, n'allez pas plus loin si vous voulez le faire vous-même.</p></aside>

## Briefing

→ [Briefing](https://gralhix.com/list-of-osint-exercises/osint-exercise-001/)  

Un screenshot de tweet est fourni, avec une photo montrant un levé de soleil dans une ville présumée d'Afrique ou du Moyen-Orient.

1. Quelles sont les coordonnées GPS de l'endroit où cette photo a été prise ?

## Résolution

Je récupère quelques informations importantes du tweet :
- Il s'agit d'une ville du nom de Kiffa 
- Le tweet a été écrit en arabe, le 20 février 2013
- D'après l'auteur, la photo a été prise le matin, le soleil doit donc se trouver à l'Est, et d'après les ombres on fait donc face au Sud
- Il y a une route en béton en direction du sud, qui semble sortir de la ville pour entrer dans un bois clairsemé
- Les bâtiments ne sont probablement pas suffisamment important pour être identifiés

Mon premier réflexe est d'aller rechercher la ville de Kiffa dans Google Maps, le premier résultat qui remonte est une ville de Mauritanie, un pays où l'arabe est effectivement parlé (ce qui est vite confirmé par le nom de nombreux emplacements sur Google Maps). Google Street View n'est pas disponible, mais en regardant les photos disponibles sur Google Search et Google Maps, je retrouve bien l'ambiance de la photo (style des bâtiments, couleur de la terre, arbres…), je suis assez sûr d'être dans la bonne ville.

En regardant Google Maps, je ne vois que 3 ou 4 routes indiquées, et un zoom rapide me confirme qu'elles semblent être les seules routes en béton. Je recherche donc :
- Une route en béton dans une direction approximative Nord-Sud
- Des arbres vers le Sud

Très vite, je vois que les seuls arbres présents en nombre sont autour de ce qui semble être un lit de rivière, et une seule route traverse ces bois parsemés dans la direction Nord-Sud, je zoom immédiatement dessus, très légèrement au Nord des arbres. Je n'ai pas d'autres images disponibles pour comparer, mais suffisamment d'éléments concordent sur Google Maps pour que ce soit le bon endroit :
- La route bifurque légèrement vers l'Ouest 
- Je peux voir l'ombre des poteaux électriques 
- Je retrouve le mur de l'autre côté de la route, ainsi que l'absence de bâtiment sur la gauche

## Solution

- **Temps passé : 2 minutes**
- **Niveau ressenti : Facile**
- **Partie 1 : [16.60944368522582, -11.39780807343817](https://www.google.com/maps?q=16.60944368522582,+-11.39780807343817)**


## Liens

[Page de l'exercice](https://gralhix.com/list-of-osint-exercises/osint-exercise-001/)    
