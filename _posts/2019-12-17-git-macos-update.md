---
layout: post
title:  "Git et les mises à jour macOS"
date:   2019-12-17
tags:
- macos
- git
description: >
  Quicktip si git ne fonctionne plus après une mise à jour de macOS
---

## XCode Command Line Tools

Suite à une mise à jour de macOS, il est (fort) possible que vous ne puissiez plus utiliser git. Toute commande affiche l'erreur suivante :

```sh
xcrun: error: invalid active developer path (/Library/Developer/CommandLineTools), missing xcrun at: /Library/Developer/CommandLineTools/usr/bin/xcrun
```

Tout comme vous êtes obligé de mettre à jour XCode suite à une mise à jour, il faut faire de même avec ses outils en CLI (ligne de commande). Pour ça il suffira de lancer la commande suivante dans votre terminal :

```sh
xcode-select --install
```

La procédure de mise à jour prend quelques minutes, et une fois terminée il faudra redémarrer votre terminal.

## Liens :

[Source du fix](https://stackoverflow.com/a/52522566/1238019)
