---
layout: post
title:  "macOS : plus de son ?"
date:   2018-01-01
tags:
- macos
- software
description: >
  Dépannage express si votre Mac n'émet plus aucun son
---

## Le problème

Pour une raison que j'ignore encore, il arrive parfois que mon Mac n'émette plus aucun son. Cela arrive généralement après plusieurs jours sans reboot, et la plupart du temps juste après un vérouillage de session.

## La solution

Le reboot est la solution la plus évidente, mais le plus souvent j'ai la flemme.

À la place, il suffit de tuer le processus `CoreAudio`, qui redémarrera tout seul quelques secondes plus tard. Pour ce faire, lancez cette commande dans votre terminal :

    sudo kill -9 `ps ax|grep 'coreaudio[a-z]' | awk '{print $1}'`

Pour plus de facilité, vous pouvez directement créer un alias pour cette commande, dans votre `.bashrc` ou votre `.zshrc` (et consort) :

    alias soundfix="sudo kill -9 `ps ax|grep 'coreaudio[a-z]' | awk '{print $1}'`"

## Liens :

[Source](https://apple.stackexchange.com/a/64024/253794)
