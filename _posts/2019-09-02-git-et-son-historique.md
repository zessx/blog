---
layout: post
title:  "Git et son historique"
date:   2019-09-02
tags:
- git
description: >
  Savoir effectuer quelques recherches dans l'historique de git peut vous faire gagner beaucoup de temps.
---

## Que cherche-t-on ?

> Never forget.

Les outils de versioning ont cela de bien qu'ils permettent de retrouver une information passée (généralement) assez simplement, à partir du moment où on sait où chercher.

Dans le cas de git, l'endroit où vous allez devoir chercher dépendra des informations que vous avez, et de ce que vous cherchez. Je vais essayer de présenter dans cet article quelques méthodes de recherche que j'utilise avec git à l'occasion.

## La commande `git log`

La base de cet article va reposer sur l'utilisation avancée de la commande `git log`. Au delà de son usage de base, il faut connaître un certain nombre d'options de cette commande, qui permettent de filtrer les commits de bien des manière.

En voici certaines, donc un grand nombre que nous utiliserons dans cet article :
- `--max-count=5` : limite le nombre de résultats (version raccourcie : `-5`)
- `--oneline` : réduit l'affichage à une seule ligne par résultat
- `--since="2 days"` : filtre par date
- `--until="2 days"` : filtre par date
- `--author="Philip .*"` : filtre par auteur (regexp)
- `--grep="2\.23"` : filtre par message et description de commit (regexp)
- `--regexp-ignore-case` : peut être utilisé avec `--grep` ou `--author` pour des regex case-insensitive
- `--no-merges` : supprime les commits de merges des résultats
- `--follow` : prend en compte les renommages (fonctionne uniquement pour un usage sur un seul fichier)
- `--reverse` : inverse l'affichage des résultats
- `--date=short` : affiche la date du commit au format cours (`YYYY-MM-DD`)
- `--format="%Cred%h %Cblue%ad %Cgreen%an <%ae> %Creset- %s"` : définit un affichage personnalisé pour les résultat
- `--patch` : affiche le patch de chaque commit

## Les messages de commit

Ce doit être votre première piste, et personne ne le redira jamais assez : un bon message de commit est un message qui décrit ce que ce commit contient. Et par décrire, on veut dire "décrire". Explicitement.

Exemple concret, j'ai involontairement ajouté une faute d'orthographe en voulant en corriger une autre, saurez-vous trouver dans quel commit ?

```sh
$ git log -5 --oneline
97840ba908dc3a127fe57a0ade6db4668aca40e2 Typo
23e63202a66736aa0b3f85469bbb5c662fd22894 Typo
747466286d0da816ef45d590d73862141ffe95b6 Typo
6df5ce69fdf05cbf6c52fecd03bc5137cd56665c Typo
fe4a21b83037006cbb7b1bd7234fef61c39194c6 Typo
```

Quand vos messages sont suffisamment clairs, il est facile de retrouver un commit en particulier dans l'historique. Vous pouvez filtrer la liste retournée par `git log` grâce à l'option `--grep`.

Prenons l'exemple du dépôt de git : `git@github.com:git/git.git`. Vous pouvez cloner ce dépôt en local afin de faire les mêmes tests que dans cet article (ça prendra un petit peu de temps vu la taille de dépôt). Si on recherche les derniers commits ayant trait à la version 2.23, on peux alors filtrer la liste ainsi :

```sh
$ git log -5 --oneline --grep="2\.23"
745f6812895b31c02b29bdfe4ae8e5498f776c26 First batch after Git 2.23
5fa0f5238b0cd46cfe7f6fa76c3f526ea98148d9 Git 2.23
8e0fa0e056f3ba423a711ef5ffb0dedc5917132c Merge tag 'l10n-2.23.0-rnd2' of git://github.com/git-l10n/git-po
a6cd2cc485b9ba73934a059245aa9de7e68a2d4c l10n: zh_CN: for git v2.23.0 l10n round 1~2
ba82e3731477fb8b9bee27eea344a594d71888fc Merge branch 'update-italian-translation' of github.com:AlessandroMenti/git-po
```

Notez que nous n'affichons ici que le sommaire des commits, le texte recherché (ici 2.23) peut très bien se trouver dans le message du commit, comme c'est le cas pour la dernière ligne. Si vous voulez avoir plus de détails sur chaque commit, enlever simplement l'options `--oneline`.

Cette première méthode peut servir à plusieurs choses :
- Savoir quand un changement a eu lieu (modification, feature, release...)
- Connaître le numéro d'un commit particulier, pour l'afficher avec `git show`, où faire toute autre opération

## Les dates de commit

Si vous avez une idée même approximative de la date à laquelle le changement que vous recherchez a eu lieu, vous pouvez filtrer les commits plutôt sur leur date que sur leur message. Pour ça vous ferez tout particulièrement attentions aux options `--since` et `--until`.

Pour les commits des 6 derniers mois :

```sh
$ git log --format="%h %ad %s" --date=short --follow --since="6 months ago" git.c
b914084007 2019-07-29 git: avoid calling aliased builtins via their dashed form
80dfc9242e 2019-07-24 git: mark cmd_rebase as requiring a worktree
b4f207f339 2019-06-21 env--helper: new undocumented builtin wrapping git_env_*()
e55f36b8b3 2019-05-15 git.c: show usage for accessing the git(1) help page
46e91b663b 2019-04-25 checkout: split part of it to new command 'restore'
b7ce24d095 2019-04-18 Turn `git serve` into a test helper
d787d311db 2019-03-29 checkout: split part of it to new command 'switch'
83b0ecf333 2019-03-20 git: read local config in --list-cmds
20de316e33 2019-03-14 difftool: allow running outside Git worktrees with --no-index
90a462725e 2019-02-25 stash: optionally use the scripted version again
40af146834 2019-02-25 stash: convert `stash--helper.c` into `stash.c`
8a0fc8d19d 2019-02-25 stash: convert apply to builtin
```

Pour les commits du mois de mars 2019 uniquement

```sh
$ git log --format="%h %ad %an <%ae> - %s" --date=short --follow --since="2019-04-01" --until="2019-04-30" git.c
b7ce24d095 2019-04-18 Turn `git serve` into a test helper
d787d311db 2019-03-29 checkout: split part of it to new command 'switch'
```

## Les modifications sur un fichier

Si vous avez besoin de connaître l'historique des modifications sur un fichier en particulier, vous pouvez regarder son historique avec `git log` :

```sh
$ git log -10 --oneline git.c
b91408400757d021b10876c36280ef891b502420 git: avoid calling aliased builtins via their dashed form
80dfc9242ebaba357ffedececd88641a1a752411 git: mark cmd_rebase as requiring a worktree
b4f207f339469e604260bdf6da8673db9c9c9105 env--helper: new undocumented builtin wrapping git_env_*()
e55f36b8b3e1248ebdc4cddfd9b08f2e86b638fb git.c: show usage for accessing the git(1) help page
46e91b663badd99b3807ab34decfd32f3cbf15e7 checkout: split part of it to new command 'restore'
b7ce24d09526d4e181920ee029c25438196c2847 Turn `git serve` into a test helper
d787d311dbd7a4104a9dde23b90ae24528a15cf9 checkout: split part of it to new command 'switch'
83b0ecf333e518867935f6b12c18294a8a7f5017 git: read local config in --list-cmds
20de316e33446f37200e51aa333ba7d824dfd478 difftool: allow running outside Git worktrees with --no-index
90a462725ef3932a2408e78a47e3dfc1b8d445cf stash: optionally use the scripted version again
```

Cet historique permet de trouver rapidement un commit, mais ne fournit pas beaucoup d'informations. Pour aller plus loin, il faudra aller voir dans le contenu même du fichier.

## La commande `git blame`

Dans certains cas vous pouvez vous retrouver face à quelques lignes de codes problématiques. Difficiles à comprendre, possiblement inutiles ou mal pensées, vous avez besoin de savoir qui les a écrites pour pouvoir en discuter avec lui/elle. La commande `git blame` est justement là pour cela : elle permet de connaître, ligne par ligne, le ou les auteurs d'un fichier.

Prenons l'exemple du fichier `git.c` de git, et regardons un peu quels en sont les auteurs :

```sh
$ git blame git.c
85023577a8f (Junio C Hamano          2006-12-19 14:34:12 -0800   1) #include "builtin.h"
b2141fc1d20 (Brandon Williams        2017-06-14 11:07:36 -0700   2) #include "config.h"
d807c4a01db (Stefan Beller           2018-04-10 14:26:18 -0700   3) #include "exec-cmd.h"
fd5c363da46 (Thiago Farina           2010-08-31 23:29:08 -0300   4) #include "help.h"
d8e96fd86d4 (Jeff King               2009-01-28 02:38:14 -0500   5) #include "run-command.h"
65b5f9483ea (Nguyễn Thái Ngọc Duy    2018-05-20 20:40:06 +0200   6) #include "alias.h"
8e49d503882 (Andreas Ericsson        2005-11-16 00:31:25 +0100   7)
007aa8d8344 (Nguyễn Thái Ngọc Duy    2018-03-24 21:35:18 +0100   8) #define RUN_SETUP           (1<<0)
007aa8d8344 (Nguyễn Thái Ngọc Duy    2018-03-24 21:35:18 +0100   9) #define RUN_SETUP_GENTLY    (1<<1)
007aa8d8344 (Nguyễn Thái Ngọc Duy    2018-03-24 21:35:18 +0100  10) #define USE_PAGER           (1<<2)
007aa8d8344 (Nguyễn Thái Ngọc Duy    2018-03-24 21:35:18 +0100  11) /*
007aa8d8344 (Nguyễn Thái Ngọc Duy    2018-03-24 21:35:18 +0100  12)  * require working tree to be present -- anything uses this needs
007aa8d8344 (Nguyễn Thái Ngọc Duy    2018-03-24 21:35:18 +0100  13)  * RUN_SETUP for reading from the configuration file.
007aa8d8344 (Nguyễn Thái Ngọc Duy    2018-03-24 21:35:18 +0100  14)  */
007aa8d8344 (Nguyễn Thái Ngọc Duy    2018-03-24 21:35:18 +0100  15) #define NEED_WORK_TREE              (1<<3)
```

On peut tout de suite avoir de nombreuses informations utiles sur la dernière modification de chaque ligne :
- la date
- l'auteur
- le commit

De la même manière que précédemment, vous pouvez ensuite utiliser la commande `git show` pour avoir plus de détail sur un commit en particulier, donc vous voyez l'identifiant affiché ici.

## Allez plus loin dans le passé

La limite principale de la commande `git blame`, c'est qu'elle n'affiche que la dernière modification. De la même manière que la commande `git log`, on a parfois besoin de connaître l'historique des modifications sur une ligne en particulier.

Reprenons les exemples précédents, pour connaître toutes les modifications sur les includes (lignes 1 à 6) du fichier `git.c`, il va falloir utiliser l'option `-L` :

```sh
$ git log -L 1,6:git.c
```

L'inconvénient c'est que le résultat est très verbeux, il est donc conseillé d'utiliser un format personnalisé afin de n'afficher que les informations qui nous intéressent (je ferai probablement un article dédié à l'option `format` plus tard) :

```sh
git log --format="%h %ad %an <%ae>%n%s" --date=short -L 1,6:git.c
```

Et vous avez là un bel historique avec les patches de chaque modification effectuée sur ces lignes !

## Liens

[Référence git - tag](https://git-scm.com/docs/git-tag)
[Référence git - blame](https://git-scm.com/docs/git-blame)
