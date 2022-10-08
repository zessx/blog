---
layout: post
title:  "VSCode et les espaces en fin de ligne"
date:   2018-05-16
tags:
- vscode
- software
description: >
  Comment supprimer les espaces en fin de ligne automatiquement, et intelligemment ?
---

> [Vous trouverez l'article equivalent pour Sublime Text par ici.](https://blog.smarchal.com/sublime-text-espaces-fin-de-ligne)

## L'option `files.trimTrailingWhitespace`

Afin de supprimer automatiquement les espaces en fin de ligne lorsque vous sauvegardez vos fichiers, activez simplement cette option dans vos préférences utilisateurs :

```json
{
  "files.trimTrailingWhitespace": true
}
```

## Le problème du Markdown

Nous avions évoqué le problème dans [l'article sur Sublime Text](https://blog.smarchal.com/sublime-text-espaces-fin-de-ligne), les espaces en fin de ligne ont un intérêt dans le language Markdown, et il est très préjudiciable de les supprimer.
Pour éviter cela, il va falloir faire une surcharge de paramètres comme ceci :

```json
{
  "files.trimTrailingWhitespace": true,

  "[markdown]": {
    "files.trimTrailingWhitespace": false
  }
}
```


## Liens
[Visual Studio Code](https://code.visualstudio.com/)
[Mes préférences utilisateur pour VSCode](https://gist.github.com/zessx/b7875430f23eda960df7f344158ff3ca)
[Le Markdown](https://fr.wikipedia.org/wiki/Markdown)
