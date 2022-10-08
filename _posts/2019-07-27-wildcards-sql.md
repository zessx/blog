---
layout: post
title:  "Les wildcards SQL"
date:   2019-07-27
tags:
- sql
description: >
  Et si un autre wildcard existait ?
---

En faisant quelques recherches `LIKE` dans une base de données cette semaine, je suis tombé sur un résultat inattendu où ma requête retournait bien plus de lignes que prévu. C'est à ce moment que j'ai découvert un wildcard SQL dont j'ignorais l'existence, tellement basique qu'il valait bien que je sorte ce blog de son sommeil annuel.

## Le wildcard `%`

Le plus connu (voire même le seul), ce wildcard permet de remplacer N caractères :

```sql
SELECT * FROM departements WHERE code LIKE '9%';
-- 90   Territoire de Belfort
-- 91   Essonne
-- 92   Hauts-de-Seine
-- 93   Seine-Saint-Denis
-- 94   Val-de-Marne
-- 95   Val-d'Oise
-- 971  Guadeloupe
-- 972  Martinique
-- 973  Guyane
-- 974  La Réunion
-- 976  Mayotte
```

## Le wildcard `_`

Le planqué, ce wildcard permet de remplacer un seul et unique caractère :

```sql
SELECT * FROM departements WHERE code LIKE '9_';
-- 90   Territoire de Belfort
-- 91   Essonne
-- 92   Hauts-de-Seine
-- 93   Seine-Saint-Denis
-- 94   Val-de-Marne
-- 95   Val-d'Oise
```

Vous pouvez bien évidemment utiliser les deux conjointement et/ou plusieurs fois, pour faire des smileys ou d'autres choses plus utiles :

```sql
SELECT * FROM departements WHERE name LIKE '%-__-%';
-- 04   Alpes-de-Haute-Provence
-- 13   Bouches-du-Rhône
-- 28   Eure-et-Loir
-- 2A   Corse-du-Sud
-- 35   Ille-et-Vilaine
-- 37   Indre-et-Loire
-- 41   Loir-et-Cher
-- 47   Lot-et-Garonne
-- 49   Maine-et-Loire
-- 54   Meurthe-et-Moselle
-- 62   Pas-de-Calais
-- 63   Puy-de-Dôme
-- 71   Saône-et-Loire
-- 77   Seine-et-Marne
-- 82   Tarn-et-Garonne
-- 92   Hauts-de-Seine
-- 94   Val-de-Marne
```

Et enfin, comme pour le wildcard `%`, il faudra l'échapper en `\_` pour recherche un underscore dans vos tables.

## Liens

- [Opérateurs de comparaison de chaînes MySQL](https://dev.mysql.com/doc/refman/5.7/en/string-comparison-functions.html)
