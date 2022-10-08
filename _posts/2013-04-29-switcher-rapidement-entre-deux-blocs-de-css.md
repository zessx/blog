---
layout: post
title:  "Switcher rapidement entre deux blocs de CSS"
date:   2013-04-29
tags:
- css
- php
- js
description: >
  En cours de développement/intégration, il arrive assez fréquemment d'avoir à basculer entre deux blocs de code. Vous pouvez bien évidemment utiliser votre éditeur préféré afin de (dé)commenter rapidement plusieurs lignes (généralement à l'aide d'un <kbd>Ctrl + K</kbd>), mais il existe aussi un petit trick pour le faire bien plus rapidement…
---

## Bloc 1 actif :

```css
/**/
#wrapper {
  width: 960px;
  margin: 0 auto;
}
/*/
#wrapper {
  width: 100%;
}
/**/
```

## Bloc 2 actif :

```css
/** /
#wrapper {
  width: 960px;
  margin: 0 auto;
}
/*/
#wrapper {
  width: 100%;
}
/**/
```

Le simple ajout d'un espace avant le dernier slash (ligne 1) vous permet de basculer sur l'autre portion de code. Et le plus beau dans tout ça, c'est que ça fonctionne aussi bien en CSS, qu'en PHP, JS, C, C++, C# ou Java !

Évitez malgré tout d'utiliser ce genre d'astuces en environnement de production et préférez l'utilisation de variables de configuration, combinées avec un vrai `if{} else {}`

## Liens
[Démo originale, par CSS Wizardry](https://jsfiddle.net/csswizardry/Kny3Q/)
[Le site CSS Wizardry](https://csswizardry.com/)
