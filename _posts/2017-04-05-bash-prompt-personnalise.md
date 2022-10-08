---
layout: post
title:  "Un bash prompt personnalisé"
date:   2017-04-05
tags:
- bash
description: >
  Présentation d'un nouveau bash prompt que j'utilise.
---

## La variable `PS1`

Commençons par le début, pour ceux qui ne seraient pas familier de bash.
Le bash prompt est la partie située à gauche du curseur, quand vous vous trouvez dans un invité de commande. Elle contient généralement des informations sur l'utilisateur et/ou le dossier courant :

    zessx:~$

La variable `PS1` est celle qui définit le contenu du bash prompt, il est possible d'améliorer ce dernier en modifiant la variable. Voici un exemple de bash prompt amélioré :

<div class="highlighter-rouge"><pre class="highlight"><code>zessx@srv <span style="color:#ff5">/var/www/</span> $</code></pre></div>

La variable `PS1` correspondante est la suivante :

    export PS1="\u@\h \[\e[38;5;11m\]\w\[$(tput sgr0)\] \\$ "

Elle contient quelques caractères spéciaux :

- `\u` : l'utilisateur courant
- `\h` : le nom d'hôte
- `\w` : le dossier courant
- `\[\e[38;5;11m\]` : le code couleur pour un jaune pâle #ff5
- `\[$(tput sgr0)\]` : le code pour annuler tout changement de couleur

## Mon bash prompt

Jusqu'ici, j'utilisais les valeurs par défaut, ou une version légèrement modifiée pour afficher la branche courante si je suis dans un dépôt git. Récemment, je me suis demandé comment je pourrais tirer parti des couleurs dans mon utilisation quotidienne au travail.
Je suis, avec mes collègues, amené à travailler sur plusieurs serveurs, et sur de nombreux dépôts git. Passer de l'un à l'autre, d'une branche à l'autre, peut amener assez rapidement à faire des erreurs si on n'est pas attentif. J'ai alors essayé de profiter de la couleur pour apporter un signal visuel immédiat à l'utilisateur, pour lui permettre de savoir s'il peut travailler tranquillement ou non.

Voici le résultat de mon bash prompt quand tout est correct :

<div class="highlighter-rouge"><pre class="highlight"><code><span style="color:#5f5">zessx@srv</span> <span style="color:#ff5">/var/www/folder</span> <span style="color:#5f5">(develop)</span><span style="color:#5f5">=</span> $</code></pre></div>

Certaines parties peuvent changer de couleur.

### L'utilisateur et le serveur

Sur nos serveurs de développement, nous sommes connectés avec nos comptes personnels. Comme ce sont les seuls serveurs ou ces comptes existent, je vérifie l'utilisateur courant afin de savoir s'il y a danger ou pas.

Cette partie est affichée en rouge si je suis sur un serveur de production, ou quand je suis connecté avec un compte `root`. Cela permet d'éviter de confondre les serveurs, mais aussi de créer des commit avec un mauvais utilisateur :


<div class="highlighter-rouge"><pre class="highlight"><code><span style="color:#f55">root@srv</span> <span style="color:#ff5">/var/www/folder</span> <span style="color:#5f5">(develop)</span><span style="color:#5f5">=</span> $</code></pre></div>

### La branche courante

Dans notre workflow (et comme dans presque tous les workflow du monde entier), il y a deux branches principales : `develop` et `master`. Aucun commit ne doit jamais être fait directement dans la branche `master`, voilà pourquoi j'affiche cette branche en rouge. `develop` est en vert, tandis que les autres branches (`fix/*`, `feature/*`...) seront en jaune :

<div class="highlighter-rouge"><pre class="highlight"><code><span style="color:#5f5">zessx@srv</span> <span style="color:#ff5">/var/www/folder</span> <span style="color:#5f5">(develop)</span><span style="color:#5f5">=</span> $
<span style="color:#5f5">zessx@srv</span> <span style="color:#ff5">/var/www/folder</span> <span style="color:#f55">(master)</span><span style="color:#5f5">=</span> $
<span style="color:#5f5">zessx@srv</span> <span style="color:#ff5">/var/www/folder</span> <span style="color:#ff5">(fix/typos)</span><span style="color:#5f5">=</span> $</code></pre></div>

Dans le cas où je ne suis pas dans un dépôt git, cette section (et la suivante) ne seront pas affichées.

### Le statut du dépôt

La dernière information contextuelle apportée par ce bash prompt, est le statut actuel du dépôt git. Je passe mon temps à lancer des `git status`, alors avoir cette information sous l'oeil est plutôt utile.
Si le dépôt est propre, un égal (=) vert s'affiche derrière la branche. Mais s'il y a des fichiers modifiés, alors c'est un tilde (~) rouge qui s'affiche, avec le nombre de modifications :

<div class="highlighter-rouge"><pre class="highlight"><code><span style="color:#5f5">zessx@srv</span> <span style="color:#ff5">/var/www/folder</span> <span style="color:#5f5">(develop)</span><span style="color:#5f5">=</span> $
<span style="color:#5f5">zessx@srv</span> <span style="color:#ff5">/var/www/folder</span> <span style="color:#5f5">(develop)</span><span style="color:#f55">~12</span> $</code></pre></div>

## Le code

Ce bash prompt est disponible [dans un Gist](https://gist.github.com/zessx/10777a44ff56304487e7970142ca0b65), vous pouvez l'installer facilement comme ceci :

    $ wget https://gist.githubusercontent.com/zessx/10777a44ff56304487e7970142ca0b65/raw/.bash-git-prompt.sh
    $ echo "\n\n# Bash Git Prompt\nsource ~/.bash-git-prompt.sh" >> ~/.bashrc
    $ source ~/.bashrc

Le code est copié dans le fichier `~/.bash-git-prompt.sh`, et ce fichier est chargé dans votre `.bashrc`.

On trouve quelques parties intéressante dans ce bash, qui pourront vous aider à créer le votre.
Je définis un certains nombre de codes couleurs, afin de ne pas avoir à les réécrire à chaque fois (vous pourrez trouver un wiki sur l'utilisation des couleurs [par ici](https://wiki.archlinux.org/index.php/Bash/Prompt_customization#Colors)) :

    # Define colors
    local RED="\[\e[31m\]"
    local YELLOW="\[\e[33m\]"
    local GREEN="\[\e[32m\]"
    local RESET="\[$(tput sgr0)\]"

Juste en dessous, je récupère l'utilisateur courant avec la commande `whoami`. Si je trouve cette valeur dans le tableau `BGP_USER_UNSAFE` défini en début de script, je colorerai le résultat en rouge. Le tout est stocké dans la variable `USER_PS` pour plus tard. Notez l'utilisation de la variable `RESET` pour éviter que tout le reste du bash prompt ne soit coloré :

    # Get username and host
    local USER=$(whoami)
    local USER_PS="$GREEN\u@\h$RESET"
    if in_array "${USER}" "${BGP_USER_UNSAFE[@]}"; then
      USER_PS="$RED\u@\h$RESET"
    fi

De la même manière, je vais aller récupérer le statut du dépôt git. J'utilise pour cela l'option `--porcelain`, qui retourne uniquement une liste des fichiers modifiés, je compte le nombre de lignes avec la commande `wc -l`. Si ce nombre est égal à 0, je stocke un égal (=) en vert dans la variable `GIT_STATUS_PS`, sinon je stocke le nombre lui-même après un tilde (~) :

    # Get git status
    local GIT_STATUS=$(git status --porcelain 2> /dev/null | wc -l)
    local GIT_STATUS_PS="$GREEN=$RESET"
    if [[ "0" != "$GIT_STATUS" ]]; then
      GIT_STATUS_PS="$RED~$GIT_STATUS$RESET"
    fi

La partie pour récupérer la branche courante est assez connue, c'est à peu de chose près ce qu'on retrouve dans bon nombre de scripts en ligne. Il y a simplement une vérification du nom pour savoir si la branche se trouve dans les tableaux `BGP_BRANCH_SAFE` ou `BGP_BRANCH_UNSAFE`.

Enfin, voici la génération proprement dite du bash prompt, qui n'est plus à ce stade qu'une simple concaténation des différentes variables créées :

    PS1="${USER_PS} ${YELLOW}\w${RESET}${GIT_BRANCH_PS} \\$ "

## Pour aller plus loin

N'hésitez pas à expérimenter, à tester différents caractères spéciaux, différentes commandes... Vous êtes libres de mettre ce que vous voulez dans le bash prompt, mais gardez à l'esprit qu'il ne faut pas que ce soit uniquement cosmétique. Essayer d'utiliser cet outil pour améliorer votre workflow et réduire les risques d'erreur.

Pour les couleurs, [allez voir ce générateur de bash prompt](http://bashrcgenerator.com/). C'est un très bon outil en ligne qu'on m'a présenté, qui permet une génération sans aucune connaissance, avec de simples drag & drop. Vous pourrez déjà découvrir les différentes couleurs, et ça vous donnera peut-être des idées.
Attention toutefois aux couleurs si vous êtes sur Windows (< 10), ce dernier ne supporte que... 8 couleurs.

## Liens

- [.bash-git-prompt.sh sur Gist](https://gist.github.com/zessx/10777a44ff56304487e7970142ca0b65)
- [Bashrc Generator](http://bashrcgenerator.com/)
- [Bash prompt basics](https://linuxconfig.org/bash-prompt-basics)
