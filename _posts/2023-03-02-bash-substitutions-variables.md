---
layout: post
title:  "Les substitutions de variables en bash"
date:   2023-03-02
tags:
- shell
description: >
  Découvrez les substitutions de variables, un outil puissant pour simplifier vos scripts.
--- 

## Présentation

La substitution de variable (ou substitution de paramètre) est une syntaxe supportée par certains shells comme bash ou zsh, qui permet de modifier les variables sans faire appel à des commandes supplémentaires.

Pour utiliser cette syntaxe, vous devez vous assurer d'utiliser le bon shell (je vais utiliser `bash` dans cet article pour mes exemples). Deux possibilités s'offrent à vous :
1. Ouvrir un nouveau terminal avec `/bin/bash` pour lancer les commandes
2. Placer les commandes dans un fichier, en ajoutant le shebang `#!/bin/bash` à la première ligne

## Valeurs par défaut

Utilisation la plus répandue, vous êtes probablement déjà tombés sur ce genre de code permettant d'utiliser une valeur par défaut, dans le cas où la variable serait indéfinie ou nulle (attention, une chaîne vide sera considérée comme nulle) :
```bash
LOG_LEVEL='debug'
echo "${LOG_LEVEL:-info}"
# debug
unset LOG_LEVEL
echo "${LOG_LEVEL:-info}"
# info
```

Il existe une variante permettant d'affecter une valeur par défaut. La différence avec l'exemple précédent est que la variable change de valeur lors du processus :
```bash
echo "${LOG_LEVEL:-info}"
# info
echo "$LOG_LEVEL"
#
echo "${LOG_LEVEL:=info}"
# info
echo "$LOG_LEVEL"
# info
```

Même si moins utile et répandue, l'opération inverse est aussi possible, où l'on remplace n'importe quelle valeur non nulle par une valeur alternative prédéfinie :
```bash
DEBUG_MODE='enabled'
echo "${DEBUG_MODE:+True}"
# True
unset DEBUG_MODE
echo "${DEBUG_MODE:+True}"
#
```

## Vérification de définition de la variable

L'opérateur `:?` est lui aussi très utile pour vérifier la bonne définition des variables, il permet de déclencher un `exit 1` avec un massage d'erreur dans le cas où la variable est indéfinie, ou nulle :
```bash
echo "${ENV:?Must be defined}"
# bash: ENV: Must be defined
# exit status 1
```

## Longueur de la variable

Autre petite astuce, pour remplacer la commande `wc -c` :

```bash
USERNAME='zessx'
echo "${#USERNAME}"
# 5
```

## Sous-chaînes

Grâce à l'opérateur `:`, il est possible d'extraire des sous-chaînes depuis votre variable. La syntaxe est très simple :
```bash
${VARIABLE:START:LENGTH}
```

À noter que le paramètre `START` peut être omis si vous souhaitez le début de la chaîne :
```bash
DATE="2022-03-02"
echo "${DATE::4}"
# 2022
echo "${DATE:5:2}"
# 03
echo "${DATE: -2:2}"
# 02
```

<aside><p>Dans le cas des valeurs négatives, il faut séparer la valeur de l'opérateur <code>:</code> par au moins une espace afin d'éviter la confusion avec l'opérateur <code>:-</code></p></aside>

## Préfixes de noms de variables

L'opérateur `!` est un peu à part, car il permet de travailler sur le nom des variables, et non pas sur leur valeur :
```bash
USERNAME="zessx"
DATE_START="2022-01-01"
DATE_END="2022-03-02"
echo "${!DATE_*}"
# DATE_START DATE_END
```

## Modification de la casse

<aside><p>Disponible avec Bash 4.0+ uniquement.</p></aside>

Il est possible de mettre en majuscule le premier caractère :

```bash
USERNAME='zessx'
echo "${USERNAME^}"
# Zessx
```

Ou l'ensemble des caractères :
```bash
USERNAME='zessx'
echo "${USERNAME^^}"
# ZESSX
```

À l'inverse, vous pouvez utiliser l'opérateur `,` pour mettre en minuscule :
```bash
USERNAME='ZESSX'
echo "${USERNAME,}"
# zESSX
echo "${USERNAME,,}"
# zessx
```

L'opérateur utilise un motif implicite `?`, ce qui correspond à n'importe quel caractère. Il est possible de modifier ce motif pour personnaliser un peu plus le changement de casse. Attention, dans tous les cas le motif ne doit correspondre qu'à un seul caractère, il n'est par exemple pas possible de faire de la capitalisation via une unique substitution :
```bash
USERNAME='zessx'
echo "${USERNAME^^[^aeiouy]}"
# ZeSSX
```

## Suppression de préfixes/suffixes

Les opérateurs `#` et `%` permettent respectivement de supprimer un préfixe ou un suffixe :
```bash
URL='blog.smarchal.com'
echo "${URL#*.}"
# smarchal.com
URL='https://blog.smarchal.com/'
echo "${URL%/}"
# https://blog.smarchal.com
```

De la même manière que pour d'autres opérateurs, il existe des versions greedy qui vont supprimer le préfixe/suffixe le plus long correspondant au motif de recherche :
```bash
URL='https://blog.smarchal.com'
echo "${URL##*/}"
# blog.marchal.com
URL='blog.smarchal.com/tag/bash/'
echo "${URL%%/*}"
# blog.marchal.com
```

## Substitution de motif

Pour finir, l'opérateur `/` va vous permettre de remplacer des éléments dans votre variable. En voici la syntaxe complète :
```bash
${VARIABLE/MOTIF/CHAINE}
```

Le motif de recherche est un peu particulier, son premier caractère réutilise les autres opérateurs que nous avons déjà vus afin de modifier le comportement de la substitution :
- Vide pour remplacer uniquement la première occurrence
- `/` pour remplacer toutes les occurrences
- `#` pour traiter le motif comme un préfixe
- `%` pour traiter le motif comme un suffixe

Les deux derniers ne sont pas forcément très utiles, car vous aurez généralement la possibilité d'obtenir le même résultat avec une substitution de motif simple, ou un autre type de substitution :
```bash
URL='http://blog.smarchal.com/tag/http/'
echo "${URL/http/https}"
# https://blog.smarchal.com/tag/http/
FILENAME='Nom de fichier avec des espaces'
echo "${FILENAME// /-}"
# Nom-de-fichier-avec-des-espaces
DATE='2022-03-02'
echo "${DATE//-/}"
# 20220302
```

## Liens

[Référence - man bash](https://fr.manpages.org/bash)    
