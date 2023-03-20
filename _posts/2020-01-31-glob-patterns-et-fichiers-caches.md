---
layout: post
title:  "Inclure les fichiers cachés dans les glob patterns"
date:   2020-01-31
tags:
- shell
- sysadmin
description: >
  Comment inclure les fichiers cachés dans vos commandes cp ?
---

## Les glob patterns

Pour copier le contenu d'un dossier (et uniquement son contenu), vous avez sûrement déjà utilisé un "glob pattern" sans même savoir que cela s'appelait comme ça :

```sh
cp from/* to/
```

Vous aurez remarqué (soit immédiatement après la copie et avec une pointe de surprise, soit après avoir supprimé le dossier `from` et avec une pointe de regret) que les fichiers cachés ne sont pas copiés avec cette commande.

En effet et par défaut, les glob patterns excluent (pour des raisons de sécurité) les fichiers cachés.

## La solution universelle

Une solution qui fonctionnera partout sera de lancer deux copies :

- une pour les fichiers visibles
- une pour les fichiers cachés

```sh
cp from/* to/
cp from/.* to/
```

Cette solution nécessite deux commandes, ce qui est somme toute contraignant, mais fonctionnel.

## Un peu d'élégance avec shopt

Cette seconde solution va utiliser les options de shell pour venir changer le comportement par défaut, et inclure les fichiers cachés dans les glob patterns grace à l'option `dotglob` (que nous activons via le flag `-s`):

```sh
shopt -s dotglob
cp from/* to/
```

Pour revenir au comportement par défaut, il faudra désactiver l'option avec le flag `-u` :

```sh
shopt -u dotglob
```

Plus élégant, mais tout aussi contraignant.

## ZSH à la rescousse

Si vous utilisez ZSH, bonne nouvelle pour vous car celui-ci supporte des flags (des Qualifiers) pour agir directement sur les glob patterns dans vos commandes. Et parmi ces flags, il en existe un pour activer l'option `dotglob` à la volée :

```sh
cp from/*(D) to/
```

Je vous invite vraiment à faire un tour sur [la documentation des Glob Qualifiers](http://zsh.sourceforge.net/Doc/Release/Expansion.html#Glob-Qualifiers), on y trouve une foule d'informations intéressantes pour simplifier vos scripts ZSH !


## Liens :

[man glob](http://man7.org/linux/man-pages/man7/glob.7.html)
[man bash](http://man7.org/linux/man-pages/man1/bash.1.html)
[ZSH Glob Qualifiers](http://zsh.sourceforge.net/Doc/Release/Expansion.html#Glob-Qualifiers)
