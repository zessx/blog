---
layout: post
title:  "Modifier un grand nombre de commits avec git"
date:   2022-11-15
tags:
- git
description: >
  Comment changer l'auteur ou le message de plein de commits facilement ?
--- 

<aside><p>Les commandes présentées dans cet article sont destructrices, pensez à travailler sur une copie de votre branche si vous n'êtes pas sûrs de vous.</p></aside>

## Cas d'usage 

Si ce n'est jamais une bonne idée sur un dépôt public ou utilisé par une équipe, il peut arriver qu'on ait besoin d'effectuer une même action sur plusieurs commits. À titre personnel, voici deux cas auxquels j'ai déjà pu faire face sur des projets, généralement dans un but de refactoring ou de nettoyage.

1. Après m'être rendu compte que j'utilisais une adresse professionnelle sur un projet personnel, j'ai cherché à changer l'auteur de tous les commits de ma branche afin de les basculer sur mon adresse personnelle.
2. Après avoir découvert l'excellent [gitmoji](https://gitmoji.dev/), il m'est arrivé plusieurs fois de vouloir changer tous les messages de commit d'un projet afin de suivre cette convention (nous sommes d'accord, il s'agit de monomanie).

## La commande `rebase`

Vous connaissez déjà la commande `rebase` et probablement sa version interactive `git rebase -i`. Pour ceux qui n'en sont pas familier, la version interactive vous permet de définir l'action à entreprendre sur chaque commit depuis le point de départ de votre rebase. Voici les plus fréquemment utilisées :
- `pick` : garder le commit tel quel
- `reword` : changer le message
- `edit` : modifier le commit lui-même
- `squash` : fusionner le commit avec le précédent

C'est une commande très pratique mais qui n'est pas sans risques, car vous réécrivez l'historique de votre branche. Petit aparté pour mieux comprendre ce que cela veut dire. Chaque commit a un hash unique qui l'identifie, et ce hash est créé à partir des éléments suivants :
- Les changements apportés
- Le message
- L'auteur
- La date
- Le hash du commit parent (*)

Quand vous utilisez `rebase` vous modifiez au moins l'un de ces éléments sur un commit. Le cas le plus courant étant de faire un rebase de sa branche sur une autre (comme `main`), ce qui a pour implication de changer le parent du "premier" commit de votre branche. Dès lors qu'un changement survient sur un commit, son hash change, mais aussi dans une réaction en chaîne les hash de tous les commits suivants (*).

Lors d'un rebase les hash des commits changent, ils sont donc considérés comme des commits différents. C'est ça que l'on appelle la réécriture de l'historique de la branche. 

La nature même de la commande `rebase` pose une contrainte : il vous faut traiter tous les commits de votre branche, les uns après les autres. Ce qui est long. Et chiant.

## L'option `--exec`

La commande `rebase` propose une option qui va nous intéresser pour automatiser certaines actions : `--exec` (ou `-x`). Voici ce que nous dit le manuel :

> Ajoute `exec <cmd>` après chaque ligne créant un commit dans l'historique final. `<cmd>` sera interprétée comme une ou plusieurs commandes shell. Toute commande qui échoue interrompra le rebase, avec le code de sortie 1.

Si je veux réécrire l'historique complet, en changeant l'adresse email de tous les commits, je peux donc utiliser la commande suivante :

```sh
git rebase --root --exec \
  "git commit --amend --author=\"Samuel Marchal <nouvelle.adresse@email.com>\" --no-edit"
```

Après chaque commit, la commande `git commit --amend` sera exécutée, et fera le changement pour moi sans aucune interaction. Vous avez bien sûr intérêt à savoir exactement ce que vous faites quand vous lancez ce genre de commande. Si certains commits avaient un auteur différent, cette information sera perdue dans le processus. Voici un autre exemple avec une version plus souple qui vérifie si je suis bien l'auteur de chaque commit avant de le modifier :

```sh
git rebase --root --exec \
  "if [ \"\$(git show --no-patch --format=%ae)\" = \"ancienne.adresse@email.com\" ]; then \
    git commit --amend --author=\"Samuel Marchal <mon.adresse@email.com>\" --no-edit; \
  fi"
```

Attention, notez le backslash dans `\$(git show …)`, ajouté pour que cette commande soit bien exécutée pendant le rebase, et non pas immédiatement (sinon vous ne testeriez que l'auteur du dernier commit, en boucle).

Comme d'habitude, le reste n'est qu'une question de besoins et d'imagination !


## Liens

[Référence Git - Rebase](https://git-scm.com/docs/git-rebase#Documentation/git-rebase.txt--xltcmdgt)    

