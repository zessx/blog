---
layout: post
title:  "Corriger votre dernière commande bash"
date:   2017-02-13
tags:
- bash
description: >
  S'il vous arrive de devoir répéter la même commande bash en changeant juste un argument, cette astuce est faite pour vous.
---

Il m'arrive parfois de faire une petite faute, ou bien d'avoir à utiliser la même commande plusieurs fois de suite, avec de petites variations. Si la commande est longue, c'est toujours assez laborieux de devoir la modifier à la main.

## Historique et substitution

La syntaxe la plus simple pour la répétition de la dernière commande, avec une substitution, est la suivante :

    $ ^search^replace^

Par exemple, vous pouvez avoir utilisé la commande `scp` pour envoyer un dossier local sur un serveur distant :

    $ scp -r ./folder1 user@host:/path/dest/

Mais vous avez un second dossier à envoyer. Plutôt que de retaper la commande précédente, ou de la modifier à grand renforts de flèches gauche, vous pouvez utiliser ceci&nbsp;:

    $ ^folder1^folder2^

## Syntaxe avancée

Dans le précédent exemple, nous n'avions qu'une seule substitution à faire. Cette syntaxe ne fonctionne malheureusement pas avec des modifications multiples. Reprenons le même exemple, mais modifions-le légèrement pour avoir ceci :

    $ scp -r ./folder1/* user@host:/path/folder1

Il faut désormais faire une substitution globale (remplacer toutes les occurrences de `folder1`).
L'autre syntaxe pour cette astuce est la suivante :

    $ !!:s/search/replace/

Le double point d'exclamation `!!` permet de relancer la commande précédente (vous l'avez peut-être déjà utilisé comme ceci : `sudo !!`), et la suite de la commande se charge de la substitution. Là où cela devient intéressant, c'est qu'on peut préciser que cette dernière doit être globale :

    $ !!:gs/folder1/folder2/
    scp -r ./folder2/* user@host:/path/folder2

Il est aussi possible d'utiliser le symbole clé `&` dans vos substitutions :

    $ !!:s/folder1/&.back/
    scp -r ./folder1.back/* user@host:/path/folder1

Voilà pour l'astuce du jour !
N'hésitez pas à partagez votre propre manière de faire dans les commentaires.
