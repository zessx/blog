---
layout: post
title:  "Synchroniser vos settings VSCode"
date:   2017-02-06
tags:
- vscode
- git
- software
description: >
  Petite astuce pour synchroniser vos paramètres et modules VSCode sur GitHub
---

Voici plusieurs mois déjà, je suis passé de Sublime Text à Visual Studio Code. Sublime Text avait une architecture de fichier permettant la sauvegarde rapide de tous mes paramètres, j'ai donc essayé de trouver l'équivalent chez VSCode. Ce n'est malheureusement pas aussi simple à faire à la main, mais une extension est précisément là pour ça !

## Settings Sync

Cette (merveilleuse) extension va vous permettre de sauvegarder vos paramètres dans un Gist, et de les charger plus tard, dans un nouvel environnement.

Seront sauvegardés :

- vos paramètres
- vos extensions
- vos snippets
- vos raccourcis claviers
- vos workspaces

## Sauvegarder

La documentation est assez claire, mais voici quand même un résumé de ce qu'il vous faudra faire.

Tout d'abord, il vous sera demandé de créer un nouveau token sur GitHub ([ici](https://github.com/settings/tokens)). Ce token sera le lien entre VSCode et votre compte GitHub, il devra donc autoriser l'accès à vos gist. **Attention, pensez à garder une trace de ce token quelque part**, car GitHub ne vous donnera pas la possibilité de le retrouver.

Une fois cette petite procédure, il ne reste plus qu'à lancer la commande `Sync: Update / Upload Settings` et l'extension se chargera de créer le gist, et d'y uploader vos paramètres.

Pour exemple, voici à quoi ressemble le gist final :
[https://gist.github.com/zessx/b7875430f23eda960df7f344158ff3ca](https://gist.github.com/zessx/b7875430f23eda960df7f344158ff3ca)

## Charger

Dans un nouvel environnement, vous n'aurez besoin que du token généré plus tôt, et de l'identifiant du gist dans lequel sont sauvegardés vos paramètres.

Prenez une installation de VSCode fraîche, installer l'extension Settings Sync, et lancez la commande `Sync: Download Settings`. On vous demandera alors le token, puis l'identifiant du gist. Validez, and voilà !

Au passage, l'extension vous affiche un récapitulatif de ce qui a été fait, et vous pouvez retrouver le token utilisé. Cela signifie quand même que vous devez avoir accès à un VSCode déjà synchronisé pour le retrouver.

## Liens

- [Settings Sync](https://marketplace.visualstudio.com/items?itemName=Shan.code-settings-sync)
