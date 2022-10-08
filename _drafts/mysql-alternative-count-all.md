---
layout: post
title:  "MySQL : une alternative à COUNT(*)"
date:   2018-01-01
tags:
- sql
description: >
  Présentation d'une alternative à l'éternel COUNT(*) en MySQL
---

## Pagination : la méthode ancestrale

Quand vous mettez en place une pagination, vous avez (la plupart du temps) besoin de connaître le nombre de résultats total afin de calculer le nombre de pages à afficher. Généralement, vous allez opter pour la méthode de la double requête :
- une première requête `SELECT` pour récupérer les données à afficher
- une seconde similaire, mais sans clause `LIMIT` et avec un `COUNT(*)` pour récupérer le nombre de résultats

    -- Première requête pour les données
    SELECT first_name, last_name
    FROM customer
    WHERE country = 5
    LIMIT 10;

    -- Seconde requête pour la pagination
    SELECT COUNT(*)
    FROM customer
    WHERE country = 5;

Cette méthode n'est pas bien complexe, mais dès lors que la requête à exécuter comporte des portions dynamiques, votre code va devoir suivre une certaine gymnastique afin de créer les deux requêtes en parallèle. Gymnastique par laquelle on perd généralement en lisibilité.

## L'option SQL_CALC_FOUND_ROWS

Il existe une option, présente à partir de MySQL 4 (depuis 2001 donc, autrement dit depuis toujours) et qui va indiquer au SGBD que nous voulons récupérer le nombre de lignes trouvées (sans tenir compte de la clause `LIMIT`). Cette option ne va pas influer sur votre requête, mais va nécessiter une seconde requête pour récupérer ce total grâce à la fonction `FOUND_ROWS()`, un peu à la manière de `LAST_INSERT_ID()`.

Comme dans l'exemple ci-dessous, l'option `SQL_CALC_FOUND_ROWS` doit être placée immédiatement après le mot-clé `SELECT`, et ne doit pas être séparé des colonnes avec une virgule :

    -- Première requête pour les données
    SELECT SQL_CALC_FOUND_ROWS first_name, last_name
    FROM customer
    WHERE country = 5
    LIMIT 10;

    -- Seconde requête pour la pagination
    SELECT FOUND_ROWS();

Comme avec la méthode précédente il va falloir exécuter deux requêtes, mais l'avantage majeur de celle-ci est que nous n'avons pas besoin de connaître la requête originelle complète.

Attention toutefois, de la même manière que vous utilisez `LAST_INSERT_ID()`, vous devez appeler `FOUND_ROWS()` immédiatement après votre première requête. Si une autre requête `SELECT` utilisant l'option `SQL_CALC_FOUND_ROWS` est exécutée entre temps, il sera trop tard pour vous et vous n'aurez pas vraiment de moyen de savoir que le nombre de résultats retourné par `FOUND_ROWS()` n'est pas celui de "votre" requête.

## Liens :

[La fonction FOUND_ROWS()](https://dev.mysql.com/doc/refman/8.0/en/information-functions.html#function_found-rows)
