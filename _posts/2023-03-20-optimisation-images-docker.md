---
layout: post
title:  "Optimiser une image Docker"
date:   2023-03-20
tags:
- docker
- devops
- shell
description: >
  Quels sont les différents moyens pour optimiser le poids et le build d'une image Docker ?
--- 

## Introduction

L'utilisation d'images Docker s'est aujourd'hui complètement démocratisé. On les retrouve pour du développement local, des pipelines ou encore dans les architectures cloud. Dans tous les cas l'image devra être built au préalable, avant de pouvoir être utilisée. Souvent même, elle devra être uploadée sur un dépôt public (Docker Hub, AWS ECR, MCR…) afin d'être accessible au téléchargement pour d'autres composants.

Dans des workflow automatisés (CI/CD), le coût des ressources est entre autres corrélé à leur puissance de calcul, leur temps d'utilisation et à la quantité de données qui transitent sur le réseau. Le temps nécessaire pour build une image Docker et son poids prennent alors un peu plus d'importance. 

Dans cet article nous allons voir les principaux moyens pour optimiser une image Docker, afin d'agir sur l'un de ces deux leviers, et parfois sur les deux en même temps.

Vous pouvez lancer le script ci-dessous en local afin de créer un simili-projet Python qui vous permettra de reproduire tous les exemples fournis :

```sh
# Crée un répertoire de travail
mkdir demo
cd demo

# Définit les packages python à installer
echo "mysqlclient" > requirements.txt

# Crée un fichier temporaire aléatoire de 50Mo
mkdir tmp
dd if=/dev/urandom of=tmp/random bs=1M count=50

# Prépare un Dockerfile de base
cat <<EOT >> Dockerfile
FROM python:3.10
WORKDIR /app
COPY . /app
RUN pip install -r requirements.txt
EOT
```

Nous allons au fur et à mesure des examples build l'image en lui affectant un tag différent, afin de pouvoir constater l'évolution de sa taille :

```sh
docker build --tag demo:0-initial .
docker image list demo
# REPOSITORY   TAG         IMAGE ID       CREATED        SIZE
# demo         0-initial   0ae36e7782d6   1 second ago   925MB
```

Avec cette première version du `Dockerfile`, vous pouvez constater que le poids de l'image s'approche du gigaoctet.

## Utiliser une image de base plus légère

La première chose à regarder si vous voulez réduire la taille d'une image Docker, c'est l'image de base qu'elle utilise. L'instruction `FROM` est obligatoire dans un `Dockerfile`, elle précise sur quelle autre image vous allez ajouter des layers. En partant de cette image, vous héritez évidemment de tous ses layers. Plus elle est lourde donc, et plus votre image finale sera lourde.

Dans certains cas, les éditeurs de ces images proposent des versions alternatives plus légères. Ces dernières contiennent beaucoup moins d'utilitaires installés par défaut, si vous avez des besoins simples elles peuvent être une alternative tout à fait viable.

Dans notre exemple, on peut voir sur le [Docker Hub](https://hub.docker.com/_/python) que les images Python sont proposées en deux versions allégées :
- `slim` : aussi basée sur Debian, mais ne contient que les packages nécessaires pour faire tourner Python
- `alpine` : basée sur Alpine Linux, une distribution légère très populaire 

Nous allons donc utiliser la version slim de notre image de base :

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN pip install -r requirements.txt
```

Sans autre modification, vous constaterez que le build ne fonctionne plus. L'installation de `mysqlclient` requiert en effet quelques packages présents dans l'image `python:3.10`, mais pas dans `python:3.10-slim`. En analysant les erreurs, il est assez simple de trouver ces packages manquants :

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN apt-get update
RUN apt-get install -y \
  default-libmysqlclient-dev \
  gcc
RUN pip install -r requirements.txt
```

À présent le build fonctionne, et on peut déjà constater une belle réduction de la taille de l'image finale :

```sh
docker build --tag demo:1-slim .
docker image list demo
# REPOSITORY   TAG         IMAGE ID       CREATED          SIZE
# demo         1-slim      ccdad45fc091   1 second ago     361MB
# demo         0-initial   0ae36e7782d6   28 minutes ago   925MB
```

## Éviter les installations inutiles

Quand on utilise une image basée sur Debian, il faut savoir que le gestionnaire de packages (APT) va par défaut installer des packages supplémentaires recommandés. Comme précédemment, vous pouvez choisir de ne pas installer ces recommendations, via le flag `--no-install-recommends`. Ce flag n'est pas disponible pour le gestionnaire d'Alpine (APK) car celui-ci n'a pas de système de recommandation.

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN apt-get update
RUN apt-get install -y --no-install-recommends \ 
  default-libmysqlclient-dev \
  gcc
RUN pip install -r requirements.txt
```

De la même manière, vous pouvez aussi gagner un peu de place en privilégiant des outils déjà installés (comme `curl`) par rapport à d'autres donc vous avez plus l'habitude (comme `wget`).

```sh
docker build --tag demo:2-useless .
docker image list demo
# REPOSITORY   TAG         IMAGE ID       CREATED          SIZE
# demo         2-useless   92f0d88ef872   1 second ago     349MB
# demo         1-slim      ccdad45fc091   4 minutes ago    361MB
# demo         0-initial   0ae36e7782d6   32 minutes ago   925MB
```

## Utiliser Dockerignore

Intéressons-nous à présent un peu plus à l'instruction `COPY` : on peut voir qu'on copie l'intégralité de notre répertoire de travail dans l'image. En temps normal, il existe tout un tas de fichiers qui n'ont aucun intérêt à se trouver dans l'image Docker : dépôt git, fichiers temporaires, environnements virtuels, dossiers liés à des éditeurs de code…

Le fichier `.dockerignore` vous permet de définir la liste des dossiers/fichiers à ignorer lors des instructions `COPY`. La syntaxe de celui-ci est exactement la même que celle des fichiers `.gitignore`. Ajoutons notre dossier temporaire et son contenu à cette liste :

```sh
echo "tmp/" > .dockerignore
```

Nous avons à présent vu les trois moyens les plus simples pour réduire le poids de vos images Docker, et que vous devriez appliquer systématiquement.

```sh
docker build --tag demo:3-dockerignore .
docker image list demo
# REPOSITORY   TAG              IMAGE ID       CREATED              SIZE
# demo         3-dockerignore   f8d42f39e878   About a minute ago   297MB
# demo         2-useless        92f0d88ef872   13 minutes ago       349MB
# demo         1-slim           ccdad45fc091   18 minutes ago       361MB
# demo         0-initial        0ae36e7782d6   46 minutes ago       925MB
```

## Réduire le nombre de layers dans l'image

Pour comprendre pourquoi réduire le nombre de layers dans une image Docker peut avoir une influence, il faut comprendre ce que sont vraiment les layers. Ce sont en fait tout simplement des images Docker. Leur seule différence avec ce qu'on appelle communément une "image" est qu'ils n'ont aucun tag attaché. À la manière d'un commit, un layer Docker est composé entre autres de :
- son identifiant
- l'identifiant de son parent
- la différence avec son parent

En multipliant les layers, vous démultipliez par la même occasion le nombre de métadonnées (identifiants, parents…) stockés dans votre image. Faisons un test en regroupant les commandes `apt-get update` et `apt-get install` :

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    gcc
RUN pip install -r requirements.txt
```

Comme vous pouvez le constater, ça ne change ici absolument rien… Sur un grand nombre de layers vous pourriez peut-être gagner quelques octets, mais rien de bien significant. Nous verrons quand même dans la section suivante en quoi cette technique peut avoir un intérêt au niveau du poids.

```sh
docker build --tag demo:4-layers .
docker image list demo
# REPOSITORY   TAG              IMAGE ID       CREATED         SIZE
# demo         4-layers         1c3baa4d57b9   8 seconds ago   297MB
# demo         3-dockerignore   f8d42f39e878   3 hours ago     297MB
# demo         2-useless        92f0d88ef872   3 hours ago     349MB
# demo         1-slim           ccdad45fc091   3 hours ago     361MB
# demo         0-initial        0ae36e7782d6   4 hours ago     925MB
```

La fusion de plusieurs layers peut en revanche avoir un intérêt au niveau de la gestion du cache. Reprenons l'exemple précédent :

```dockerfile
RUN apt-get update
RUN apt-get install …
```

Dans cet exemple lors d'un premier build, le résultat des deux layers sera mis en cache. Pour les instruction `RUN`, le cache n'expire que si le texte de la commande change, son résultat n'est pas pris en compte. Si vous changez les packages installés par la seconde commande et relancez un build, voici donc ce qu'il va se passer :
- Le premier layer avec `apt-get update` sera récupéré depuis le cache, le texte de la commande n'ayant pas changé
- Le second layer avec `apt-get install` sera rebuild, mais installera d'anciennes versions datant de la date du premier build

Dans le temps, et comme le premier layer restera en cache indéfiniment, vous continuerez d'installer d'anciennes versions des packages, ce qui finira forcément par poser problème. En fusionnant ces deux layers, vous vous assurez que la commande `apt-get update` sera toujours relancée après un changement des packages à installer. Nous allons reparler des layers et du cache dans la suite de cet article.

## Faire du nettoyage après les installations

Quand vous lancez `apt-get update`, la liste des packages disponibles à l'installation est téléchargée dans le dossier `/var/lib/apt/lists/`. Après l'installation, cette liste ne sert plus à rien et peut être supprimée. Comme nous l'avons vu dans la section sur les layers, les instructions suivantes n'auraient aucun intérêt :

```dockerfile
RUN apt-get update \
  && apt-get install
RUN rm -rf /var/lib/apt/lists/*
```

En effet, même si vous supprimez la liste dans le second layer, elle est belle et bien présente dans le premier, et son poids se répercutera donc sur celui de votre image finale. Nettoyez toujours cette liste dans la même instruction que `update` et `install` :

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY . /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    gcc \
  && rm -rf /var/lib/apt/lists/*
RUN pip install -r requirements.txt
```

On peut constater que même avec aussi peu de packages, le gain de place est notable :

```sh
docker build --tag demo:5-cleanup .
# REPOSITORY   TAG              IMAGE ID       CREATED          SIZE
# demo         5-cleanup        4871e32c8358   14 seconds ago   279MB
# demo         4-layers         1c3baa4d57b9   26 minutes ago   297MB
# demo         3-dockerignore   f8d42f39e878   4 hours ago      297MB
# demo         2-useless        92f0d88ef872   4 hours ago      349MB
# demo         1-slim           ccdad45fc091   4 hours ago      361MB
# demo         0-initial        0ae36e7782d6   4 hours ago      925MB
```

## Ordonner les layers pour bénéficier du cache

Nous en avons déjà parlé plus tôt, mais comprendre la gestion du cache dans les images Docker est essentiel pour pouvoir optimiser vos images.

Pour la plupart des instructions, Docker va simplement vérifier si cette exacte commande a déjà été buildée depuis le même parent. Le cas échéant, Docker va retourner le résultat en cache. Ce mécanisme permet en particulier de bénéficier des layers déjà présents dans d'autres images, afin de accélérer les builds de manière notable. Je le répète, mais c'est important : Docker ne se base que sur le texte de la commande pour invalider le cache, et non pas sur son résultat.

Les instructions `ADD` et `COPY` sont des exceptions, car le contenu de chaque fichier est vérifié : si un seul checksum diffère, le cache est invalidé. À noter : les dates de dernière modification et de dernier accès ne sont pas prises en compte dans le checksum.

Si on regarde en détail notre dernier build, voici ce qu'on peut lire :
```sh
# …
# => [1/5] FROM docker.io/library/python:3.10-slim@sha256:…
# => CACHED [2/5] WORKDIR /app
# => [3/5] COPY . /app
# => [4/5] RUN apt-get update && apt-get install -y --no-install-recommends …
# => [5/5] RUN pip install -r requirements.txt
# …
```

Comme nous avions changé le contenu du fichier `Dockerfile`, le cache de l'instruction `COPY` a été invalidé. Conséquemment, les caches de tous les layers suivants sont eux aussi invalidés. Ce mécanisme est très important à assimiler : faites bien attention à l'ordre de vos layers afin de minimiser le nombre d'invalidation de cache. Dans notre exemple, nous pouvons déplacer l'instruction `COPY` juste après le `RUN apt-get`, car les commandes dans l'instruction `RUN` ne dépendent pas du contenu des fichiers :

```dockerfile
FROM python:3.10-slim
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    gcc \
  && rm -rf /var/lib/apt/lists/*
COPY . /app
RUN pip install -r requirements.txt
```

Sur le premier build, cela ne changera évidemment rien :

```sh
docker build --tag demo:6-sort .
# …
# => [1/5] FROM docker.io/library/python:3.10-slim@sha256:…
# => CACHED [2/5] WORKDIR /app
# => [3/5] RUN apt-get update && apt-get install -y …
# => [4/5] COPY . /app
# => [5/5] RUN pip install -r requirements.txt
# …
```

Mais modifions à présent un fichier, afin de voir la différence :

```sh
echo "pytest" >> requirements.txt
docker build --tag demo:6-sort .
# …
# => [1/5] FROM docker.io/library/python:3.10-slim@sha256:…
# => CACHED [2/5] WORKDIR /app
# => CACHED [3/5] RUN apt-get update && apt-get install -y …
# => [4/5] COPY . /app
# => [5/5] RUN pip install -r requirements.txt
# …
```

On peut constater que la mise à jour et l'installation des packages avec APT provient bien du cache, et nous permet de gagner du temps de build. En gérant finement l'ordre et la fusion de vos layers, vous pouvez accélérer vos pipelines de manière significative, tout en réduisant les coûts associés.

## Utiliser les étapes de builds (multi-stage)

Jusqu'ici nous n'avons travaillé qu'avec une seule étape, définie par la présence d'une instruction `FROM`. Il est cependant possible d'utiliser plusieurs instructions `FROM`, on parle alors d'étapes multiples ou multi-stage.

Cette méthode de construction des `Dockerfile` est intéressantes à plusieurs égards :
- Pour avoir une image de production plus légère et sécurisée que celle de développement 
- Pour éviter de maintenir plusieurs fichiers `Dockerfile`
- Pour optimiser la taille de l'image, dans certains cas

Reprenons notre projet : nous venons d'ajouter le package Python `pytest`, mais celui-ci n'aura d'utilité qu'en phase de développement. Nous allons chercher à créer une image de production propre, sans outils de développement. Commençons-donc par séparer les dépendances Python en deux :

```sh
echo "mysqlclient" > requirements.txt
echo "pytest" > requirements-dev.txt
```

À présent nous pouvons repartir de l'image Docker actuelle, en lui ajoutant le label `production` (attention, il ne s'agit pas d'un tag et cette référence n'existe qu'au sein du `Dockerfile`). Une seconde étape avec le label `development`, basée sur `production`, la complétera avec une unique instruction pour installer les outils de développement :

```dockerfile
FROM python:3.10-slim AS production
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    gcc \
  && rm -rf /var/lib/apt/lists/*
COPY . /app
RUN pip install -r requirements.txt

FROM production AS development
RUN pip install -r requirements-dev.txt
```

Par défaut Docker va lire l'intégralité du fichier `Dockerfile`, l'image produite sera donc celle de développement, car à la toute fin du fichier. Vous pouvez utiliser l'option `--target` pour cibler une étape en particulier, après laquelle le build s'arrêtera. Ici, nous allons cibler l'étape `production`, et on constate que l'image fait de nouveau la taille qu'elle avait avant l'ajout du package `pytest` :

```sh
docker build --tag demo:7-multistage --target production .
# REPOSITORY   TAG              IMAGE ID       CREATED          SIZE
# demo         7-multistage     8a95031c393b   2 seconds ago    279MB
# demo         6-sort           5eccd5d0d59d   14 minutes ago   283MB
# demo         6-order          eab39b6747e6   52 minutes ago   279MB
# demo         5-cleanup        4871e32c8358   2 hours ago      279MB
# demo         4-layers         1c3baa4d57b9   2 hours ago      297MB
# demo         3-dockerignore   f8d42f39e878   5 hours ago      297MB
# demo         2-useless        92f0d88ef872   5 hours ago      349MB
# demo         1-slim           ccdad45fc091   5 hours ago      361MB
# demo         0-initial        0ae36e7782d6   6 hours ago      925MB
```

## Aplatir l'image

Pour aller encore plus loin dans l'optimisation, il est possible d'aplatir une image. Il s'agit en fait de venir copier l'état courant d'une image sur une base vierge à l'aide de l'instruction `FROM scratch`, suivie d'un `COPY --from`. On "écrase" alors tous les layers, en perdant au passage toute leur hiérarchie.

Cette technique à certes l'avantage de réduire encore plus le poids de l'image finale, mais vous devez garder en tête les deux inconvénients principaux qu'elle apporte avec elle :
- Vous ne bénéficiez pas du cache sur l'étape d'aplatissement, ce qui peut ralentir le build
- La totalité des fichiers seront copiés avec le propriétaire `root:root` (il est possible de remédier à cela grâce à l'option `--chown` de l'instruction `COPY`, mais l'opération peut vite devenir un casse-tête selon la complexité de votre image)

Pour notre example, nous allons simplement renommer l'étape `production` en `build`, et créer une nouvelle étape `production` qui viendra simplement copier l'intégralité des fichiers :

```dockerfile
FROM python:3.10-slim AS build
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    gcc \
  && rm -rf /var/lib/apt/lists/*
COPY . /app
RUN pip install -r requirements.txt

FROM scratch AS production
COPY --from=build / /

FROM build AS development
RUN pip install -r requirements-dev.txt
```

Cet exemple est là purement à titre de démonstration, afin de vous présenter la technique :

```sh
docker build --tag demo:8-flatten --target production .
# REPOSITORY   TAG              IMAGE ID       CREATED          SIZE
# demo         8-flatten        62755cd1768e   41 seconds ago   273MB
# demo         7-multistage     8a95031c393b   3 minutes ago    279MB
# demo         6-sort           5eccd5d0d59d   17 minutes ago   283MB
# demo         6-order          eab39b6747e6   55 minutes ago   279MB
# demo         5-cleanup        4871e32c8358   2 hours ago      279MB
# demo         4-layers         1c3baa4d57b9   2 hours ago      297MB
# demo         3-dockerignore   f8d42f39e878   5 hours ago      297MB
# demo         2-useless        92f0d88ef872   5 hours ago      349MB
# demo         1-slim           ccdad45fc091   5 hours ago      361MB
# demo         0-initial        0ae36e7782d6   6 hours ago      925MB
```

Sans aller jusqu'à une image plate, l'instruction `COPY --from` est très intéressante dans l'utilisation de `Dockerfile` multi-stage, généralement pour copier uniquement des binaires en provenance d'une étape de build complexe. Ceci peut vous éviter à la fois un nettoyage fastidieux et vous permettre de partir d'une Alpine pour l'image de production uniquement.

## Liens

[Référence Docker - Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)    
[Référence Docker - Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)    
