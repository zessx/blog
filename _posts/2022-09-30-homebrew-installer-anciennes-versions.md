---
layout: post
title:  "Installer des anciennes versions avec Homebrew"
date:   2022-09-30
tags:
- macos
- software
description: >
  Comment installer d'anciennes versions de formulas/casks avec Homebrew
---

## Homebrew

Si vous ne connaissez pas déjà Homebrew, je ne sais pas trop ce que vous faites sur cet article, mais soit… Il s'agit d'un gestionnaire de paquets pour macOS, au même titre par exemple que APT ou YUM pour les distributions Linux. Les paquets sont divisés en "Formulas" (paquets) et en "Casks" (applications natives pour macOS).

Un inconvénient de Homebrew est que celui-ci ne permet désormais plus que d'installer la dernière version d'une formula ou d'un cask. C'est un choix réfléchi de la part de l'équipe qui maintient Homebrew, et qui ne pose la plupart du temps aucun problème.

Nous allons toutefois voir dans cet article comment installer des versions supprimées du dépôt Homebrew, par exemple pour les cas où vous avez un problème de compatibilité avec la dernière release, et que vous souhaitez rollback sur la précédente.

## Installer une ancienne formula

Je vais prendre pour exemple une formula stable et commune : `wget`. Vous pouvez commencer par vérifier la version actuelle de votre formula :

```sh
# On confirme que wget a été installé avec Homebrew
which wget
# /opt/homebrew/bin/wget

# On vérifie la version actuelle
wget --version | head -1
# GNU Wget 1.21.3 compilé sur darwin21.3.0.
```

Les formulas sont de simples fichiers Ruby, qui vont permettre de télécharger et build des sources si nécessaire (souvent avec un `make install`). Tous ces fichiers sont placés dans un dépôt unique [homebrew-core](https://github.com/Homebrew/homebrew-core) accessible sur GitHub. Pour accéder à une ancienne version, il suffit donc d'aller chercher dans l'historique de ce dépôt avec git !

```sh
# On clone le dépôt en local
# Les options sont juste là pour accélérer le clonage, et éviter de récupérer ce qui ne nous intéresse pas
git clone --filter=blob:none --no-checkout --single-branch --branch master git@github.com:Homebrew/homebrew-core.git
cd homebrew-core

# On affiche la liste des commits apportant des modifications à notre formula
git log --oneline --follow -- Formula/wget.rb
# 08cbea5ab7 wget: update 1.21.3 bottle.
# 67bd0078ef wget 1.21.3
# 208f22f5ae wget: update 1.21.2 bottle.
# 8c809f6e07 wget: update 1.21.2 bottle.
# 35f6eca67a wget: update 1.21.2 bottle.
# 831685264d wget 1.21.2
# …
```

Ici, si nous voulons basculer sur la version 1.21.2, nous allons viser le dernier commit de cette version : le `208f22f5ae`

```sh
# On bascule sur le commit qui nous intéresse
git checkout 208f22f5ae

# On dissocie les binaire actuellement utilisés
brew unlink wget

# On lance l'installation directement grâce au fichier Ruby
brew install Formula/wget.rb

# On vérifie que la formula a bien été installée dans la version voulue
wget --version | head -1
#GNU Wget 1.21.2 compilé sur darwin21.1.0.
```

Pour revenir à la version la plus récente, il vous suffit de dissocier les anciens binaires et relancer une installation classique :

```sh
brew unlink wget
brew install wget
```

Pour terminer, j'ajouterais que vous pouvez toujours trouver les binaires des versions précédentes dans votre dossier Homebrew, si vous en avez besoin :

```sh
ls -l /opt/homebrew/Cellar/wget/
1.21.2
1.21.3
```

## Installer un ancien cask

La procédure est la même, mais nous travaillons cette fois-ci avec le dépôt des casks. Je prends ici l'application Insomnia pour exemple :

```sh
/Applications/Insomnia.app/Contents/MacOS/Insomnia
# 14:37:26.651 › Running version 2022.6.0
# …

git clone --filter=blob:none --no-checkout --single-branch --branch master git@github.com:Homebrew/homebrew-cask.git
cd homebrew-cask
git log --oneline --follow -- Casks/insomnia.rb
# 53bd52547a Update insomnia from 2022.5.1 to 2022.6.0 (#132410)
# a162369f12 insomnia 2022.5.1
# 63b0624406 insomnia 2022.5.0
# 062af5973e insomnia 2022.4.2
# ea2417312f insomnia 2022.4.1
# c9a830a0ae insomnia 2022.4.0
# …
```

La différence principale est qu'ici nous ne pouvons pas simplement dissocier les binaires, il faut complètement désinstaller l'application :

```sh
git checkout 63b0624406
brew uninstall insomnia
brew install --cask Casks/insomnia.rb

/Applications/Insomnia.app/Contents/MacOS/Insomnia
# 14:40:11.231 › Running version 2022.5.0
# …
```

Là aussi, pas de problème pour repasser sur la dernière release :

```sh
brew uninstall insomnia
brew install --cask insomnia
```

## Liens

[Homebrew - Terminologie](https://docs.brew.sh/Formula-Cookbook#homebrew-terminology)
[Homebrew - Système de version](https://docs.brew.sh/Versions#acceptable-versioned-formulae)
[GitHub - Dépôt des formulas](https://github.com/Homebrew/homebrew-core/)
[GitHub - Dépôt des casks](https://github.com/Homebrew/homebrew-cask/)
