---
layout: post
title:  "Configurer Sublime Text en 30 secondes grâce à git"
date:   2014-10-30
tags:
- sublime-text
- git
- software
description: >
  Comment sauvegarder la configuration de votre éditeur préféré afin de la restaurer en 30 secondes grâce à git ?
---

## Pourquoi ?

Comme tout éditeur, Sublime Text peut être paramétré selon vos besoins. C'est d'autant plus vrai que cet éditeur en particulier fonctionne sur une base de plugins. Arrive alors un jour où pour une raison X vous avez besoin de le réinstaller (sur une nouvelle machine ou non). Et ce jour là, vous allez passer un temps fou à retrouver vos préférences, les raccourcis clavier que vous aviez paramétrés, les paramètres que vous aviez mis en place pour un langage particulier, les builds, et surtout les plugins que vous aviez installés mais dont vous ne connaissez pas systématiquement le nom.

Et si vous aviez une sauvegarde de toute cette configuration, restaurable en quelques clics ?
C'est là que git intervient.

## Que faut-il sauvegarder ?

Heureusement pour nous, Sublime Text 3 utilise une architecture de dossiers assez bien pensée. Cette architecture sépare bien les préférences utilisateurs, des plugins installés. Nous pouvons donc nous concentrer sur trois types de fichiers :

- Les raccourcis clavier (`.sublime-keymap`)
- Les préférences utilisateur (`.sublime-settings`)
- Les builds (`.sublime-build`)

En plus de cela, il va falloir sauvegarder les plugins installés. Là, nous remercions de tout notre cœur [Will Bond](https://wbond.net/), qui a créé le plugin **Package Control**, lequel permet d'installer simplement d'autres plugins via Sublime Text, mais surtout d'installer une liste complète de plugins prédéfinis ! Cette liste se trouve tout simplement dans le fichier `Package Control.sublime-settings`, dont voici un exemple :

```json
{
  "installed_packages":
  [
    "Emmet",
    "Language - French - Français",
    "PackageResourceViewer",
    "Theme - Afterglow"
  ]
}
```

Plutôt que de sauvegarder l'intégralité de nos plugins, nous n'allons garder que Package Control et sa configuration, ce qui présente plusieurs avantages :

- un gain de place évident sur notre sauvegarde
- seules les mises à jour de Package Control doivent être répercutées sur notre sauvegarde
- l'assurance d'avoir des plugins à jours lors de l'installation

## Créer votre sauvegarde

Selon votre système d'exploitation, tous ces fichiers vont se trouver dans un dossier précis :

- `%APPDATA%/Sublime Text 3` pour Windows
- `~/.config/sublime-text-3` pour Linux
- `~/Library/Application Support/Sublime Text 3` pour OS X

Rendez-vous donc dans ce dossier et créez un repository (exemple pour Windows) :

```sh
cd %APPDATA%/Sublime Text 3
git init
```

Créez ensuite un fichier `.gitignore` pour filtrer les fichiers à sauvegarder :

```sh
# Tout ignorer sauf le fichier .gitignore
*
!.gitignore

# Garder le plugin Package Control uniquement
!Installed Packages
Installed Packages/*
!Installed Packages/Package Control.sublime-package

# Garder les raccourcis clavier, les préférences et les builds
!Packages
Packages/*
!Packages/User
Packages/User/*
!Packages/User/*.sublime-keymap
!Packages/User/*.sublime-settings
!Packages/User/*.sublime-build
```

Voilà votre sauvegarde prête, vous n'avez plus qu'à la mettre à jour et l'envoyer sur GitHub par exemple :

```sh
git remote add origin https://github.com/<user>/st3-settings.git
git add --all
git commit -m "Ma sauvegarde Sublime Text 3"
git push origin master
```

## Restaurer votre sauvegarde

Vous avez une installation toute fraîche de Sublime Text 3, et vous désirez à présent restaurer votre sauvegarde, afin de retrouver votre environnement de travail habituel. Voici pour votre plus grand plaisir la marche à suivre (exemple pour Windows) :

```sh
cd %APPDATA%/Sublime Text 3
git init
git remote add origin https://github.com/<user>/st3-settings.git
git fetch
git checkout -t origin/master
```

**30 secondes, chrono.**

La dernière étape ? Tout simplement lancer Sublime Text 3, et laisser Package Control vous installer les autre plugins.

## Liens

[Sublime Text 3](https://www.sublimetext.com/3)
[Package Control](https://sublime.wbond.net/)
[Ma configuration ST3](https://github.com/zessx/st3-settings)
