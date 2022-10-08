---
layout: post
title:  "Éviter la copie vide dans Sublime Text"
date:   2018-03-13
tags:
- sublime-text
description: >
  Comment éviter les erreurs de copier/coller avec Sublime Text ?
---

## L'option `copy_with_empty_selection`

Il arrive parfois (souvent) qu'on loupe un <kbd>Ctrl+C</kbd> / <kbd>Ctrl+V</kbd> lorsqu'on travaille de manière un peu mécanique. L'exemple typique étant de copier une portion de code, changer de fichier, placer son curseur, puis relancer stupidement un <kbd>Ctrl+C</kbd>...

Le fonctionnement par défaut de Sublime Text sera de vider votre presse-papier. Su-per.

Pour éviter ce genre de petit désagréments, vous pouvez changer l'option suivante dans vos préférences :

    "copy_with_empty_selection": false
