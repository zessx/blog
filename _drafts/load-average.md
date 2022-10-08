---
layout: post
title:  "Comprendre load average"
date:   2021-08-01
tags:
- sysadmin
description: >
  Qu'est-ce que le load average, comment le comprendre et l'utiliser correctement ?
---

## Définition

Le load average est la moyenne de la charge système, une mesure de l'activité de ce système sur une période instant donné.

Cette notion de charge est simple et représente le nombre de processus actifs (running). Le load average est donc le nombre moyen de processus actifs (running) sur une période donnée.

## Utilisation

La commande `top` permet de récupérer le load average, avec quantité d'autres informations. Voici deux exemples d'output de la commande, respectivement pour les systèmes Ubuntu et macOS :

```
top - 12:02:06 up 835 days, 11:48,  1 user,  load average: 0.68, 0.47, 0.34
Tasks: 107 total,   1 running,  65 sleeping,   0 stopped,   0 zombie
%Cpu(s):  0.2 us,  0.0 sy,  0.0 ni, 99.7 id,  0.2 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem :  3941160 total,   544352 free,  1215644 used,  2181164 buff/cache
KiB Swap:   976556 total,   961964 free,    14592 used.  2314332 avail Mem
…
```

<!-- -->

```
Processes: 576 total, 2 running, 574 sleeping, 2805 threads
Load Avg: 3.90, 3.70, 3.12  CPU usage: 15.20% user, 8.52% sys, 76.26% idle   SharedLibs: 224M resident, 68M data, 19M linkedit.
MemRegions: 335789 total, 4109M resident, 147M private, 1758M shared. PhysMem: 15G used (4763M wired), 689M unused.
VM: 4279G vsize, 1993M framework vsize, 305618028(0) swapins, 312938807(0) swapouts. Networks: packets: 157875202/166G in, 85097967/28G out.
Disks: 104504956/3111G read, 81731933/2061G written.
…
```

Dans les deux cas, on retrouve le load average sous le même format :

```sh
# Ubuntu
load average: 0.68, 0.47, 0.34
# macOS
Load Avg: 3.90, 3.70, 3.12
```

Ce format se décompose en 3 valeurs :
- La moyenne de charge calculée sur la dernière minute
- Celle sur les 5 dernières minutes
- Celle sur les 15 dernières minutes

Nous allons voir comment interpréter ces valeurs, mais notez que la commande `htop` est aussi disponible pour un affichage plus visuel, avec la possibilité de filtrer les processus, ou encore de les trier par utilisation de mémoire, de CPU, d'uptime… C'est un excellent outil pour surveiller l'état de votre machine.

## Interprétation

Avant d'aller plus loin, retenez bien une règle simple :

> Un processeur ne peut effectuer qu'une seule opération à la fois

Dans les deux exemples présentés ci-dessus, on peut voir des valeurs très différentes. Décortiquons le premier résultat, sur un système Ubuntu :

```sh
load average: 0.68, 0.47, 0.34
```

Nous avons donc des moyennes de charge de :
- 0.68 sur la dernière minute
- 0.47 sur les 5 denières
- 0.34 sur les 15 dernières

La première conclusion à tirer de ces chiffres est que le système n'est pas surchargé : sur les 15 dernières minutes (au moins) le load average n'atteint jamais la valeur de 1. Cela signifie que le processeur peut globalement traîter toutes les opérations sans mettre de processus en attente (gardez en tête que c'est une moyenne).

La seconde conclusion, c'est que le processus est légèrement plus chargé sur la dernière minute. Les raisons peuvent être multiples, et leur interprétation ne dépendra que de vous. Dans ce cas précis, nul besoin de s'alarmer, je venais à l'instant de me connecter sur le serveur pour lancer la comande `top`. Cette connexion, plus la commande elle même ont provoqué cette légère hausse.

Prenons maintenant le second exemple, sur le système macOS :

```sh
Load Avg: 3.90, 3.70, 3.12
```

Nous trouvons les moyennes de charge suivantes :
- 3.90 sur la dernière minute
- 3.70 sur les 5 denières
- 3.12 sur les 15 dernières

Par rapports aux autres résultats, ces chiffres peuvent sembler alarmants. Mais vous devez prendre en compte un second facteur (volontairement occulté dans le début de cet article) essentiel pour les interpréter correctement : **le nombre de cœurs**. Nous pouvons à présent étendre notre règle de départ :

> Un processeur à N cœurs ne peut effectuer que N opérations à la fois

Avec un processeur monocore un load average de 1 signifie que le système est à 100% de ses capacités. Mais sur un dualcore, cette même valeur ne représentera que 50% des capacités du système.

Dans ce second exemple, il s'agit d'une machine équipée d'un Intel Core i7 double cœur à 2.5Ghz, on peut tirer comme conclusion que le processeur est à 195% de ses capacités (et non pas 390%), donc en surcharge. Là où ça se complique, c'est que les Core i7 sont équipé de la technologie Hyper-Threading (ou SMT) développée par Intel, qui permet d'avoir 2 thread en parallèles sur chaque cœur. S'il s'agit donc techniquement d'un dualcore, ce processeur a les mêmes capacités qu'un quadcore, ce qui ramène sa charge à 97% de ses capacités.

Pour information, voici les niveaux que j'utilise dans mon monitoring de serveurs :
- Niveau d'alerte à 0.9 / 0.7 / 0.5
- Niveau critique à 1.0 / 0.8 / 0.6

Si un load average dépasse la valeur de 2.0 sur la dernière minute, ou de 1.2 sur les 15 dernières minutes, le niveau critique est atteint. À noter que ces valeurs ne sont pas identiques (2.0 / 2.0 / 2.0) car les moyennes sont pondérées, avec une importance plus grande apportée aux valeurs récentes.

Ces valeurs sont évidemment à multiplier par le nombre de cœurs de la machine (voire plus avec l'Hyper-Threading).

## Actions

Il existe plusieurs leviers pour réduire un load average important.

### Le reboot

> Have you tried turning it off and on again?

Avec le temps et pour diverses raisons, un certains nombre de processus peuvent se retrouver inutiles. Un simple redémarrage peut aider à supprimer ces processus dupliqués ou zombies. Il s'agit de l'action la plus simple et rapide à entreprendre, mais ce n'est aussi qu'une résolution symptomatique à court terme.

### Le nombre de processeurs

Levier le plus évident : plus vous aurez de processeurs, plus vous pourrez traiter d'opérations en parallèle.

### La puissance des processeurs

Plus les processeurs seront puissants (et donc rapides), plus ils pourront traiter d'opération à la seconde. Les processus passeront donc moins de temps en état actif (running), et le load average sera forcément moindre.

Attention toutefois, dans certains cas un processus peut être bloqué parce qu'il est en attente d'un périphérique I/O (réseau, clavier, disque dur…). Il provoque alors l'augmentation du load average, mais ne pourra pas s'exécuter plus rapidement de toute façon. Dans ce cas la solution est à trouver dans les périphériques qui provoquent ce blocage.

Pour vous aider dans vos décisions, et savoir si le processeur est vraiment sous-dimensionné, regardez les autres métriques de la commande `top`, comme l'utilisation du CPU. Dans notre exemple sur macOS :

```
CPU usage: 15.20% user, 8.52% sys, 76.26% idle
```

Malgré une moyenne de charge à 97%, 76% du CPU est inactif. Il ne s'agit donc pas dans cet exemple d'un problème de processeur, mais d'une surcharge momentanée due à des processus en attente I/O.

### Le code et son architecture

Probablement votre meilleure chance d'améliorer les choses. La plupart du temps, le load average met en évidence des problèmes de performances dans la codebase. Il peut être assez ardu d'en identifier la source, commencez par surveiller le nombre de visites et l'évolution du load average dans le temps (dans le cas d'un serveur accessible via le web) :
- Si le nombre de visites est correlé avec le load average, voyez pour mettre en place un proxy et du cache pour soulager votre serveur web.
- Si le load average augmente soudainement à des heures précises, rechercher quels crons sont lancés à ces moment et optimisez-les
- Si le load average augmente progressivement avec le temps, vous oubliez probablement de fermer certaines flux quand vous n'en avez plus besoin
