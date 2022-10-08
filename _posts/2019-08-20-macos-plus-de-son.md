---
layout: post
title:  "macOS : plus de son ?"
date:   2019-08-20
tags:
- macos
- bash
- software
description: >
  Dépannage express si votre Mac n'émet plus aucun son
---

## Le problème

Pour une raison que j'ignore encore, il arrive parfois que mon Mac n'émette plus aucun son. Cela arrive généralement après plusieurs jours sans reboot, et la plupart du temps juste après un verouillage de session.

## La solution

Le reboot est la solution la plus évidente, mais le plus souvent j'ai la flemme.

À la place, il suffit de tuer le processus de CoreAudio, qui redémarrera tout seul quelques secondes plus tard. Pour ce faire, lancez cette commande dans votre terminal :

    sudo kill -9 `ps ax | grep 'coreaudio[a-z]' | awk '{print $1}'`

La commande en détails pour les curieux :

- `ps ax` : affiche les processus lancés (sans l'option `u` pour ne pas avoir trop de détails)
- `grep 'coreaudio[a-z]'` : dans tous ces processus, rechercher celui qui concerne l'exécutable de CoreAudio
- `awk` : la ligne récupérée par `grep` (exemple `181   ??  Ss     1:04.55 /usr/sbin/coreaudiod`) va être divisée en champs, avec pour séparateur par défaut les espaces
- `'print {$1}'` : fonction de la commande `awk` pour afficher un champ, le premier ici (soit le PID de CodeAudio)
- `kill -9` : on stoppe le processus avec le signal SIGKILL (arrêt forcé)

Pour plus de facilité, vous pouvez directement créer un alias pour cette commande, dans votre `.bashrc` ou votre `.zshrc` (et consort) :

    alias soundfix="sudo kill -9 `ps ax | grep 'coreaudio[a-z]' | awk '{print $1}'`"

## Liens :

[Source](https://apple.stackexchange.com/a/64024/253794)
[La commande ps](http://www.linux-france.org/article/man-fr/man1/ps-1.html)
[La commande grep](http://www.linux-france.org/article/man-fr/man1/grep-1.html)
[La commande awk](https://www.shellunix.com/awk.html)
[La commande kill](http://www.linux-france.org/article/man-fr/man1/kill-1.html)
