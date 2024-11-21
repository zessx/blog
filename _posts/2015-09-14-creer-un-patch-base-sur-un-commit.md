---
layout: post
title:  "Créer un patch basé sur un commit"
date:   2015-09-14
tags:
- git
description: >
  Comment créer une archive contenant tous les fichiers ajoutés ou modifiés par un ou plusieurs commits ?
---

## git archive

Le premier réflexe lorsqu'on désire créer un patch est de se tourner vers la commande `git archive`. Son nom est suffisamment explicite pour qu'on s'y intéresse rapidement. Malheureusement, cette commande crée une archive contenant l'intégralité des fichiers d'un dépôt à un instant t. C'est utile, mais ce n'est pas ce que l'on cherche.

Si vous voulez télécharger une archive de votre dépôt tel qu'il était lors d'un commit précis, vous pouvez utiliser cette commande :

```sh
git archive -o archive.zip f23e4c
```

Pour une archive de votre dépôt dans son état courant, remplacer le numéro de commit par HEAD :

```sh
git archive -o archive.zip HEAD
```

Il est possible, toujours en utilisant `git archive`, de ne télécharger que quelques fichiers précis. Il suffit d'ajouter leurs noms en fin de commande, comme ceci :

```sh
git archive -o archive.zip HEAD path/file1.txt path/file2.txt
```

Là, ça devient intéressant…
Il faudrait trouver un moyen de lister les fichiers créés/modifiés lors d'un commit.

## git diff

Vous connaissez forcément cette commande, qu'on utilise pour connaître les différences apportées par un commit sur des fichiers. Pour afficher les modifications apportées par le dernier commit, par exemple, on utilise cette ligne de commande :

```sh
git diff HEAD~1
```

Si nous avons bien la la liste des fichiers modifiés, la sortie de la commande est assez verbeuse, et beaucoup de ces informations ne nous intéressent pas. Il existe cependant une option pour n'afficher que le nom des fichiers, et pas le contenu :

```sh
git diff --name-only HEAD~1
```

## FUUU…SION, HA!

L'astuce, c'est d'utiliser la sortie de la commande `git diff` pour l'injecter dans la commande `git archive`. Ce petit tour de passe-passe se réalise ainsi :

```sh
git archive -o patch.zip HEAD $(git diff --name-only HEAD~1)
```

Cette ligne de commande crée un fichier `patch.zip`, contenant les fichiers modifiés depuis le dernier commit, dans leur état courant.

Il reste toutefois un petit problème à prendre en compte. Quand un fichier est supprimé, il apparaît dans le listing des fichiers modifiés (la sortie de `git diff`). Or, étant supprimé, la commande `git archive` n'arrive pas à
localiser le fichier et génère une erreur. Pour éviter ces erreurs, vous pouvez choisir quels types de modifications sont affichées par `git diff` grâce à l'option `diff-filter` :

```sh
git archive -o patch.zip HEAD $(git diff --name-only --diff-filter=ACMRTUXB HEAD~1)
```

`diff-filter` accepte plusieurs valeurs, toutes cumulables :

- `A` pour les ajouts
- `C` pour les copies
- `D` pour les suppressions
- `M` pour les modifications
- `R` pour les renommages
- `T` pour les changements de type
- `U` pour les fichiers unmerged
- `X` pour les fichiers inconnus (ne devrait jamais apparaître)
- `B` pour les fichier dépassant un taux de modification défini par l'option `--break-rewrites`

Cette option ne peut pas faire de filtre "négatifs", c'est-à-dire dans notre cas "tout, sauf les suppressions", nous sommes donc obligés de cumuler les 8 autres valeurs pour obtenir le résultat escompté : `--diff-filter=ACMRTUXB`

## Les patchs à la pelle

Maintenant que vous avez la ligne de commande magique, vous pouvez très aisément créer des patchs pour de nombreux cas de figure.
Un patch pour les 5 derniers commits :

```sh
git archive -o patch.zip HEAD $(git diff --name-only --diff-filter=ACMRTUXB HEAD~5)
```

Un autre pour les dernières 24 heures :

```sh
git archive -o patch.zip HEAD $(git diff --name-only --diff-filter=ACMRTUXB HEAD@{"One day ago"})
```

Plus courant, un patch pour passer d'un commit à un autre :

```sh
git archive -o patch.zip f456d8e $(git diff --name-only --diff-filter=ACMRTUXB 11d2ea3)
```

Bref, il suffit de remplacer les deux références par ce qui vous plaît. Afin d'automatiser tout ça, voici un petit bout de code à placer dans votre fichier `~/.bashrc` :

```sh
# Create a git patch (zip format)
create_git_patch() {
  git archive -o $3 $1 $(git diff --name-only --diff-filter=ACMRTUXB $2)
}
alias git-patch=create_git_patch
```

Vous pouvez ainsi l'utiliser beaucoup plus facilement, sans avoir à retenir la commande complète :

```sh
git-patch HEAD HEAD~1 patch.zip
```

Pour finir, merci à [@ronanpellegrini](https://x.com/ronanpellegrini) de m'avoir parlé de ce genre d'astuce. La commande d'origine ne créait pas de zip, mais quand on a compris la mécanique le résultat n'est plus très loin !

## Liens
- [Documentation de git archive](https://git-scm.com/docs/git-archive)
- [Documentation de git diff](https://git-scm.com/docs/git-diff)
