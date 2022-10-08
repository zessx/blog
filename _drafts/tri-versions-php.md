---
layout: post
title:  "Trier un tableau de versions en PHP"
date:   2015-01-01
tags:
- php
description: >
  Comment trier un tableau de versions efficacement en PHP ?
---

## Le problème des versions

Le versioning, c'est parfois compliqué mais c'est pas méchant... Mais c'est parfois compliqué.

Considérons les numéros de version tels que définis par [SemVer](https://semver.org/) (qui, porté par GitHub, tend à devenir une norme). Ils sont aussi nombreux que différents, mélangeant chiffres, lettres et ponctuation. Imaginez un peu devoir ordonner ces numéros :

- `1.0.10`
- `1.0.0`
- `1.0.0-rc.2`
- `1.1.0`
- `2.0.0`
- `1.0.0-beta`
- `1.0.1`
- `1.0.2`
- `1.0.0-alpha`
- `1.0.0-rc.1`

## La fonction `version_compare`

PHP fournit depuis sa version 4 une fonction permettant de comparer deux numéros de version :

    version_compare('1.1.2', '1.2.0');

La fonction `usort` quant à elle permet de trier un tableau en utilisant une fonction de comparaison. Celle-ci peut aussi bien être une fonction native qu'une fonction qu'on aura écrit. Ici, nous allons simplement combiner `usort` avec `version_compare` :

    usort($versions, 'version_compare');


## Liens :

[La fonction version_compare](http://php.net/version_compare)
[La fonction usort](http://php.net/usort)