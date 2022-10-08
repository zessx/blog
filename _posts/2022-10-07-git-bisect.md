---
layout: post
title:  "Git Bisect"
date:   2022-10-07
tags:
- git
description: >
  Présentation de la commande git bisect, pour vous aider à trouver l'origine d'un bug.
---

## Présentation

La commande `git bisect` vous permet de trouver la modification qui a introduit un bug, à l'aide d'une [recherche dichotomique](https://fr.wikipedia.org/wiki/Recherche_dichotomique) ("bisect" en est d'ailleurs la traduction littérale). C'est une méthode assez rapide et efficace, particulièrement sur les projets avec un CHANGELOG incomplet ou inexistant.


## Mise en situation

Je vais prendre pour exemple un projet très populaire : [Prettier](https://prettier.io/). Pour vous mettre en conditions, imaginez vous travaillant sur un projet ou Prettier est installé en version 2.3.1. Comme c'est une version qui date un peu, on vous demande de passer sur une version plus récente, la 2.6.1. Vous mettez à jour vos dépendances, et soudainement une erreur survient sur le bout de code suivant :

```scss
.background-gradient(@cut) {
  background: linear-gradient(
    to right,
    @white 0%,
    @white (@cut - 0.01%),
    @portal-background @cut,
    @portal-background 100%
  );
}
```

L'erreur en question est la suivante :

```sh
# TypeError: Cannot read property 'endOffset' of undefined
```

Pourtant, vous n'avez pas changé votre code. L'erreur vient donc de Prettier, dont les versions 2.3.1 et 2.6.1 réagissent différemment.

## Tutoriel

Votre premier réflexe sera probablement d'aller chercher si cette erreur remonte dans les issues GitHub du projet, [et vous auriez bien raison](https://github.com/prettier/prettier/issues/12504). Il peut cependant arriver qu'aucun résultat ne remonte, dans ce cas vous aimeriez bien connaître le commit qui introduit ce bug, afin de pouvoir ouvrir vous-même une issue et/ou corriger le problème.

Pour cela, nous allons devoir cloner le dépôt Prettier pour plus tard lancer `git bisect` dessus :

```sh
git clone git@github.com:prettier/prettier.git
cd prettier
```

Nous allons ensuite faire une copie du code problématique dans ce dépôt :

```sh
echo ".background-gradient(@cut) {\n\
  background: linear-gradient(\n\
    to right,\n\
    @white 0%,\n\
    @white (@cut - 0.01%),\n\
    @portal-background @cut,\n\
    @portal-background 100%\n\
  );\n\
}" > test-file.scss
```

On peut à présent basculer sur les deux versions testées, pour confirmer que le bug existe :

```sh
# On bascule sur la version 2.3.1
git checkout 2.3.1
yarn && bin/prettier.js -c test-file.scss
# Checking formatting…
# All matched files use Prettier code style!

# On bascule sur la version 2.6.1
git checkout 2.6.1
yarn && bin/prettier.js -c test-file.scss
# Checking formatting…
# test-file.scss[error] test-file.scss: TypeError: Cannot read property 'endOffset' of undefined
# [error]     at locEnd (~/prettier/src/language-css/loc.js:225:22)
# [error]     at isNextLineEmpty (~/prettier/src/common/util.js:140:42)
# [error]     at ~/prettier/src/language-css/printer-postcss.js:929:19
# [error]     at ~/prettier/src/common/ast-path.js:108:23
# [error]     at AstPath.each (~/prettier/src/common/ast-path.js:95:7)
# [error]     at AstPath.map (~/prettier/src/common/ast-path.js:107:10)
# [error]     at Object.genericPrint [as print] (~/prettier/src/language-css/printer-postcss.js:905:20)
# [error]     at callPluginPrintFunction (~/prettier/src/main/ast-to-doc.js:133:21)
# [error]     at mainPrintInternal (~/prettier/src/main/ast-to-doc.js:76:17)
# [error]     at ~/prettier/src/main/ast-to-doc.js:63:28
# All matched files use Prettier code style!
```

Initialisons la commande `bisect` avec ces informations :

```sh
git bisect start
git bisect good 2.3.1   # Le bug n'est pas présent sur le tag 2.3.1
git bisect bad 2.6.1    # Le bug est présent sur le tag 2.6.1
# Bisecting: 445 revisions left to test after this (roughly 9 steps)
# [5746d2f22f326bf59e36ff8ab15eba594c66b0e6] Build(deps-dev): Bump concurrently from 6.3.0 to 6.4.0 in /website (#11805)
```

On voit que la commande commence immédiatement le travail : elle nous a basculé sur un autre commit (le `5746d2f`)… et plus rien. À ce stade, la commande attend que vous testiez la version courante, et lui confirmiez si le bug est présent ou non.

```sh
yarn && bin/prettier.js -c test-file.scss
# Checking formatting…
# All matched files use Prettier code style!
```

Le bug n'est pas présent, nous en informons donc la commande en conséquence :

```sh
git bisect good
# Bisecting: 222 revisions left to test after this (roughly 8 steps)
# [7d7f7e928a65a14ff27aa9790130c74edfc9b2d1] Reduce bundled size of `diff` package (#12160)
```

Une nouvelle bascule sur un commit, et à nouveau un test à faire de notre côté. Vous pouvez noter dans l'output que la commande vous indique le nombre approximatif de tests qu'il vous reste à faire (ici 8), avant que le commit problématique soit identifié. On continue donc en répétant les opérations précédentes :

```sh
yarn && bin/prettier.js -c test-file.scss
# Checking formatting…
# All matched files use Prettier code style!
git bisect good
# Bisecting: 111 revisions left to test after this (roughly 7 steps)
# [0a65d2a8f0a7b345c254960afdfe1fbebb90d108] Build(deps): Bump preactjs/compressed-size-action from 2.3.0 to 2.4.0 (#12328)
yarn && bin/prettier.js -c test-file.scss
# Checking formatting…
# test-file.scss[error] test-file.scss: TypeError: Cannot read property 'endOffset' of undefined
# [error]     at locEnd (~/prettier/src/language-css/loc.js:225:22)
# [error]     at isNextLineEmpty (~/prettier/src/common/util.js:140:42)
# [error]     at ~/prettier/src/language-css/printer-postcss.js:928:19
# [error]     at ~/prettier/src/common/ast-path.js:108:23
# [error]     at AstPath.each (~/prettier/src/common/ast-path.js:95:7)
# [error]     at AstPath.map (~/prettier/src/common/ast-path.js:107:10)
# [error]     at Object.genericPrint [as print] (~/prettier/src/language-css/printer-postcss.js:904:20)
# [error]     at callPluginPrintFunction (~/prettier/src/main/ast-to-doc.js:133:21)
# [error]     at mainPrintInternal (~/prettier/src/main/ast-to-doc.js:76:17)
# [error]     at ~/prettier/src/main/ast-to-doc.js:63:28
# All matched files use Prettier code style!
```

Ah, cette fois-ci le bug apparaît, nous allons donc l'indiquer à la commande, et continuer ainsi de suite jusqu'à la fin (je vous passe ici les résultats des tests) :

```sh
git bisect bad
# Bisecting: 55 revisions left to test after this (roughly 6 steps)
# [6819dc91f6455f255d3d9c0db5eb8934b2165ae5] Add an esbuild plugin to add `@ts-nocheck` annotation for vendors (#12248)
git bisect bad
# Bisecting: 27 revisions left to test after this (roughly 5 steps)
# [08b0e2a0e569eb958874fbc8f2b5ad90b861e660] Build(deps): Bump clipboard from 2.0.8 to 2.0.9 in /website (#12195)
git bisect good
# Bisecting: 13 revisions left to test after this (roughly 4 steps)
# [668567cc58dd9427dcc6d473b171f2606230c1b7] Build(deps): Bump jest-docblock from 27.4.0 to 27.5.0 (#12231)
git bisect bad
# Bisecting: 6 revisions left to test after this (roughly 3 steps)
# [76bb0226d56362134a86edaedffdb089ffce4422] Replace globby with fast-glob (#12223)
git bisect bad
# Bisecting: 3 revisions left to test after this (roughly 2 steps)
# [a0cc4ab43ba1920e37bb685e1651b36d2e1fda2e] Reduce bundle size of  `parser-postcss.js` (#12204)
git bisect good
# Bisecting: 1 revision left to test after this (roughly 1 step)
# [e22c4911f8bb951932715a7223dc29a81dfdb982] Preserve empty lines in CSS/SCSS paren groups (#12210)
git bisect bad
# Bisecting: 0 revisions left to test after this (roughly 0 steps)
# [8886e6310a5d4b332dc65911c1b3acf3fb60afc6] Build: Add `--clean` (#12186)
git bisect good
# e22c4911f8bb951932715a7223dc29a81dfdb982 is the first bad commit
# commit e22c4911f8bb951932715a7223dc29a81dfdb982
# Author: Lucas Duailibe <lucasds@gmail.com>
# Date:   Wed Feb 2 07:38:59 2022 -0300

#     Preserve empty lines in CSS/SCSS paren groups (#12210)

#  changelog_unreleased/css/12210.md                  | 32 ++++++++++++++++++
#  src/language-css/printer-postcss.js                | 38 +++++++++++++++-------
#  …/css/atrule/__snapshots__/jsfmt.spec.js.snap    | 35 +++++++++++++++++---
#  …/css/parens/__snapshots__/jsfmt.spec.js.snap    | 31 ++++++++++++++++++
#  tests/format/css/parens/empty-lines.css            | 12 +++++++
#  5 files changed, 132 insertions(+), 16 deletions(-)
#  create mode 100644 changelog_unreleased/css/12210.md
#  create mode 100644 tests/format/css/parens/empty-lines.css
```

Voilà, vous savez à présent que c'est le commit `e22c491` qui a introduit le bug, à vous de voir ce que vous faites désormais de cette information.


## Usage avancé

Ici, nous n'avions que deux commandes à lancer pour faire notre test :

```sh
yarn
bin/prettier.js -c test-file.scss
```

C'est aussi pour cela que j'ai choisi ce projet. L'utilisation de `bisect` peut être un peu plus fastidieuse quand le test requiert un grand nombre de commandes, pour installer et build le projet par exemple. Dans ces cas il est possible de créer un script contenant l’exemple des commandes, pour ensuite l'utiliser directement avec `git bisect run`. En reprenant notre exemple précédent, voici ce que cela donnerait :

```sh
# On crée le script
echo "#/bin/bash\n\
yarn\n\
bin/prettier.js -c test-file.scss" > test-script.sh

# On pense à lui donner les droits d'exécution
chmod +x test-script.sh

# Et on lance git bisect
git bisect start
git bisect good 2.3.1
git bisect bad 2.6.1
# Bisecting: 445 revisions left to test after this (roughly 9 steps)
# [5746d2f22f326bf59e36ff8ab15eba594c66b0e6] Build(deps-dev): Bump concurrently from 6.3.0 to 6.4.0 in /website (#11805)
git bisect run ./test-script.sh
# …
# …
# e22c4911f8bb951932715a7223dc29a81dfdb982 is the first bad commit
# commit e22c4911f8bb951932715a7223dc29a81dfdb982
# Author: Lucas Duailibe <lucasds@gmail.com>
# Date:   Wed Feb 2 07:38:59 2022 -0300

#     Preserve empty lines in CSS/SCSS paren groups (#12210)

#  changelog_unreleased/css/12210.md                  | 32 ++++++++++++++++++
#  src/language-css/printer-postcss.js                | 38 +++++++++++++++-------
#  …/css/atrule/__snapshots__/jsfmt.spec.js.snap    | 35 +++++++++++++++++---
#  …/css/parens/__snapshots__/jsfmt.spec.js.snap    | 31 ++++++++++++++++++
#  tests/format/css/parens/empty-lines.css            | 12 +++++++
#  5 files changed, 132 insertions(+), 16 deletions(-)
#  create mode 100644 changelog_unreleased/css/12210.md
#  create mode 100644 tests/format/css/parens/empty-lines.css
# bisect run success
```

Plus rapide, n'est-ce pas ?

Votre script doit renvoyer un code 0 si le test est un succès, et un code entre 1 et 127 (inclus) si c'est un échec. Dans notre exemple, la commande `bin/prettier.js` renvoie déjà les codes nécessaires, ce qui explique pourquoi nous n'avons rien eu à faire d'autre.

> Attention, le code de retour 125 est réservé et ne doit pas être utilisé.


## Liens

[Référence git - bisect](https://git-scm.com/docs/git-bisect)
