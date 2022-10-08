---
layout: post
title:  "Réordonner les colonnes en PostgreSQL"
date:   2017-03-13
tags:
- sql
description: >
    Savez-vous comment modifier l'ordre des colonnes dans une table PostgreSQL ? Non ? Alors c'est par ici que ça ce passe !
---

## La solution toute simple...

...n'existe pas.

Malheureusement, PostgreSQL ne considère pas le tri des colonnes comme prioritaire. Pour tout dire, cette feature n'existe même pas encore. Il existe cependant quelques astuces (plus ou moins propres) pour contourner le problème en attendant.

Je vais vous présenter les différentes solutions proposées [sur le wiki](https://wiki.postgresql.org/wiki/Alter_column_position) de PostgreSQL, avant de vous donner la méthode que j'utilise.
Pour chaque exemple, on partira de la table suivante :

    CREATE TABLE ordertest (a text, c text, b text);
    INSERT INTO ordertest (a, c, b)
    VALUES ('1a', '1c', '1b'), ('2a', '2c', '2b');

## Créer une nouvelle table

Cette technique consiste tout simplement à ne pas se prendre la tête :

- on crée une nouvelle table, suffixée d'un mot clé (du type `_new`, `_temp`...), avec les colonnes dans l'ordre désiré
- on copie les données de l'ancienne table vers la nouvelle
- on supprime l'ancienne table
- on renomme la nouvelle table

<!-- -->

    CREATE TABLE ordertest_temp (a text, b text, c text);
    INSERT INTO ordertest_temp SELECT a, b, c FROM ordertest;
    DROP TABLE ordertest;
    ALTER TABLE ordertest_temp RENAME TO ordertest;

Méthode évidente, quoique fastidieuse.

## Ajouter une colonne, et déplacer les données

Il est aussi possible de réordonner les colonnes sans passer par une nouvelle table :

- on ajoute les colonnes dans l'ordre désiré, suffixée d'un mot clé (du type `_new`, `_temp`...)
- on copie les données des anciennes colonnes vers les nouvelles
- on supprime les anciennes colonnes
- on renomme les nouvelles colonnes

<!-- -->

    ALTER TABLE ordertest ADD COLUMN b_temp text, ADD COLUMN c_temp text;
    UPDATE ordertest SET b_temp = b, c_temp = c;
    ALTER TABLE ordertest DROP COLUMN b, DROP COLUMN c;
    ALTER TABLE ordertest RENAME COLUMN b_temp TO b;
    ALTER TABLE ordertest RENAME COLUMN c_temp TO c;

Cette méthode est tout aussi longue que la précédente, et n'apporte honnêtement rien de plus.

## Utiliser une vue

Une autre technique proposée est de fournir une vue intermédiaire, qui cachera l'ordre véritable des colonnes :

- on modifie le nom de la table
- on crée une vue avec les colonnes dans l'ordre désiré, et avec le nom d'origine de la table

<!-- -->

    ALTER TABLE ordertest RENAME TO ordertest_real;
    CREATE VIEW ordertest AS SELECT a, b, c FROM ordertest_real;

C'est certes plus rapide à mettre en place, mais on se retrouve en contrepartie à gérer des tables et des vues, pour une simple histoire d'ordre de colonnes. Est-ce vraiment utile ?

## Quelle technique utiliser ?

Forcément, tout va dépendre de vos besoins. S'il s'agit d'un simple confort de lecture, j'aurais tendance à vous pousser à utiliser les vues.
Les vues sont un outil très utile qui permet par exemple de fournir une lecture simplifiée de certaines tables, ou bien de recouper des informations afin d'y apporter une certaine valeur ajoutée.

Mais si vous êtes juste maniaque, et que ça vous énerve que tout ne soit pas bien ordonné, en route pour la première option ;)


## Liens

[PostgreSQL](https://www.postgresql.org/)
[Article du wiki PostgreSQL](https://wiki.postgresql.org/wiki/Alter_column_position)
