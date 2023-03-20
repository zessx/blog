---
layout: post
title:  "Renommer un volume Docker"
date:   2022-10-21
tags:
- docker
- devops
- sysadmin
- shell
description: >
  Comment faire pour renommer un volume Docker, sans en perdre les données ?
---

## Problème et cas d'usage

Docker ne propose aucun moyen de renommer un volume. Habituellement, ce n'est pas une fonctionnalité dont nous avons besoin (ce qui explique sûrement l'absence de commande dédiée), mais qui peut dans de rares cas de refactoring nous faire gagner un temps fou.

Récemment, il m'est arrivé d'avoir à renommer un projet qui utilisait Docker Compose. Comme Compose se base sur le nom du dossier racine pour nommer ses conteneurs (`project_container_1`) et volumes (`project_volume`), je savais dès le départ que ce changement provoquerait la suppression de mes anciens volumes. Mais dans ceux-ci, une base de données de plusieurs dizaines de Go, dont je me passerais bien une réinstallation complète.

Je cherchais donc un moyen pour renommer `project_volume` en `newproject_volume` afin que celui-ci soit détecté automatiquement par Docker Compose, sans perte de données.

## Solution

L'idée est simple : créer un nouveau volume avec le bon nom, puis utiliser un conteneur utilisant les deux volumes pour copier la donnée de l'ancien vers le nouveau. Un gros avantage à cette solution : elle n'est pas destructrice et vous pouvez vérifier sans risque que tout s'est bien passé.

```sh
# On commence par créer le nouveau volume
docker volume create --name newproject_volume
# On utilise un conteneur alpine (pour sa légèreté) pour copier les données
docker run --rm -it -v project_volume:/source -v newproject_volume:/dest alpine /bin/sh -c "cd /source; cp -av . /dest"
```

Et voilà !

## Liens

[Référence Docker - volume create](https://docs.docker.com/engine/reference/commandline/volume_create/)
[Référence Docker - run](https://docs.docker.com/engine/reference/commandline/run/)
