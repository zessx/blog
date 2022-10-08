---
layout: post
title:  "Le tri de tableaux insensible à la casse en PHP"
date:   2015-01-01
tags:
- php
description: >
  Comment trier des tableaux sans tenir compte de la casse ?
---

## Trier un `array` unidimensionnel

La fonction `sort` permet de trier un tableau, mais par défaut, le tri tiendra compte de la casse, ce qui n'est parfois pas le résultat escompté :

    $languages = array('HTML', 'jQuery', 'CSS', 'MySQL', 'PHP');
    sort($languages);

    // CSS, HTML, MySQL, PHP, jQuery
    print_r($languages);

Ce qu'on ne sait pas forcément, c'est que cette fonction accepte un second argument `sort_flags`, permettant de décrire la manière dont doivent être triés les éléments. Parmis les valeurs intéressantes on trouvera :

- `SORT_NUMERIC`, pour trier des éléments numériques
- `SORT_NATURAL`, pour trier avec un ordre naturel (1, 2, 3, 10, 11, 20, 21)
- `SORT_FLAG_CASE`, pour trier sans tenir compte de la casse

Dans le cas qui nous intéresse il faudra combiner deux constantes, afin de trier des chaînes de caractère sans tenir compte de leur casse :

    $languages = array('HTML', 'jQuery', 'CSS', 'MySQL', 'PHP');
    sort($languages, SORT_STRING | SORT_FLAG_CASE);

    // CSS, HTML, jQuery, MySQL, PHP
    print_r($languages);

## Trier un `array` multidimensionnel

Prenons le tableau suivant :

    $languages = array(
        array('name' => 'HTML',   'date' => 1997),
        array('name' => 'jQuery', 'date' => 2006),
        array('name' => 'CSS',    'date' => 1996),
        array('name' => 'MySQL',  'date' => 1995),
        array('name' => 'PHP',    'date' => 1994)
    );

C'est un peu plus délicat ici, parce qu'on voudrait trier le tableau entier en se basant sur une clé présente dans les éléments de ce tableau. On va donc commencer par récupérer uniquement les valeurs de la clé qui nous servira de référence pour le tri (ici `name`) :

    $names = array_column($languages, 'name');

En va ensuite utiliser `array_multisort` pour trier simultanément ce tableau de référence, et le tableau d'origine. Toutes les opération de tri opérées sur le premier, seront reportées sur le second ; il s'agit donc d'un simple tri unidimensionnel sur le tableau de référence, reporté sur le tableau d'origine :

    array_multisort($names, SORT_STRING | SORT_FLAG_CASE, $languages);

    // [CSS, 1996], [HTML, 1997], [jQuery, 2006], [MySQL, 1995], [PHP, 1994]
    print_r($languages);

## Liens :

[La fonction sort](http://php.net/manual/fr/function.sort.php)
[La fonction array_column](http://php.net/manual/fr/function.array-column.php)
[La fonction array_multisort](http://www.php.net/manual/fr/function.array-multisort.php)