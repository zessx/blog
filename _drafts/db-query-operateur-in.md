---
layout: post
title:  "db_query() et l'opérateur IN()"
date:   2017-02-01
tags:
- drupal
- sql
description: >
  Comment utiliser l'opérateur IN() avec db_query ?
---

## db_query()

Avec Drupal, vous pouvez créer des requêtes SQL personnalisées à l'aide de la fonction `db_query()`.
Le problème de cette fonction, c'est que vous n'avez aucun moyen d'utiliser l'opérateur SQL `IN()`, comme dans cette requête :

    SELECT nid
    FROM dp_node
    WHERE type IN('foo', 'bar', 'baz');

La première idée de code qui vient en tête pour réaliser cette requête est la suivante :

    $results = db_query(
      'SELECT nid FROM {node} WHERE type in(:types)',
      array(
        ':types' => array('foo', 'bar' 'baz')
      )
    );

Malheureusement, `db_query()` ne prévoit pas l'utilisation d'un placeholder multiple.
Il y a bien un moyen de faire fonctionner tout ça en trichant avec `implode()`, mais on est obligé d'injecter les valeurs directement dans la requête, et on pert tout l'intérêt et la sécurité des requêtes préparées.

## Les requêtes dynamiques

Drupal offre un autre moyen d'écrire des requêtes soi-même : les requêtes dynamiques. Ce sont des requêtes créées dynamiquement par Drupal, un mini ORM en quelque sorte. Elles s'opposent aux requêtes statiques dont nous avons parlé plus haut.
Voici la requête précédente dans ce format :

    $results = db_select('node', 'n')
      ->fields('n', array('nid'))
      ->condition('type', array('foo', 'bar', 'baz'), 'IN')
      ->execute();

## Drupal 8

**Toutes les fonctions dont nous avonc parlé sont dépréciées depuis Drupal 8**.
Vous devez désormais récupérer une connexion via le conteneur de services, mais rassurez-vous, le code ne change presque pas :

    $connection = \Drupal::database();
    $results = $connection->select('node', 'n')
      ->fields('n', array('nid'))
      ->condition('type', array('foo', 'bar', 'baz'), 'IN')
      ->execute();

## Liens
- [Les requêtes statiques (Drupal 7)](https://www.drupal.org/docs/7/api/database-api/static-queries)
- [Les requêtes dynamiques (Drupal 7)](https://www.drupal.org/node/310075)
- [La couche d'abstraction de BDD (Drupal 8)](https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Database!database.api.php/group/database/8.2.x)
