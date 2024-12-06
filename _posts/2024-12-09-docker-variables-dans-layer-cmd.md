---
layout: post
title:  "Utiliser des variables dans le layer CMD"
date:   2024-12-09
tags:
- docker
description: >
  Apprenez à faire des Dockerfile génériques, en utilisant des variables dans le layer CMD
---

## De quoi parle-t-on ?

Sur certains projets comme (entre autres) les [monorepos](https://monorepo.tools/), il peut vous arriver d'avoir à builder plusieurs images Docker. Dans ce cas vous pouvez vous aider soit de plusieurs Dockerfile, soit des builds multi-stages.

Prenons un monorepo avec deux applications `backend` et `frontend` par exemple. On peut envisager deux fichiers `Dockerfile.backend` et `Dockerfile.frontend`, qu'il faudrait ensuite cibler à l'aide de l'option `-f` :

```sh
docker build -f Dockerfile.backend  -t app-backend .
docker build -f Dockerfile.frontend -t app-frontend .
```

Il est aussi possible, et surtout dans le cas où vos deux applications partagent une partie du Dockerfile, de se reposer sur le multi-stage :

```dockerfile
FROM busybox:latest AS common
# …

FROM common AS backend
CMD ["echo", "backend"]

FROM common AS frontend
CMD ["echo", "frontend"]
```

Dans ce cas, vous utiliserez l'option `--target` pour choisir l'application à build :

```sh
docker build -t app-backend  . --target backend
docker build -t app-frontend . --target frontend
```

## Don't repeat yourself

Dans cet example volontairement plus simple que réaliste pour illustrer mon propos, on peut voir que les stages des deux applications pourraient être factorisés. C'est tout à fait possible grâce à l'instruction `ARG` du Dockerfile, qui permet de recevoir un argument lors du build. Le Dockerfile ressemblerait alors à ceci :

```dockerfile
FROM busybox:latest
ARG APP
# …
CMD ["echo", $APP]
```

Et les commandes de build à cela :

```sh
docker build -t app-backend  . --build-arg APP=backend
docker build -t app-frontend . --build-arg APP=frontend
```

## Le problème

Au moment de lancer nos nouvelles images, on va vite comprendre qu'il y a un soucis :

```sh
docker run --rm app-frontend
# /bin/sh: [echo,: not found
```

Le message est cryptique et ne permet pas si facilement que ça d'en comprendre l'origine. Il s'agit en fait d'un problème d'expansion de paramètre. L'instruction `CMD` n'utilise pas de shell lorsque vous utilisez sa forme "exec" (avec les crochets), et sans shell, pas d'expansion de variable. Plusieurs idées peuvent alors venir en tête :
- Englober `$APP` dans des doubles guillemets (`CMD ["echo", "$APP"]`) : toujours sans expansion de variable, cela revient à afficher la chaîne de caractères "$APP", et non pas la valeur de la variable
- Utiliser la form "shell" de `CMD` (`CMD echo $APP`) : c'est une bonne solution, mais pas toujours possible. En effet, si vous utilisez une instruction `ENTRYPOINT` (ce qui est généralement le cas), les deux instructions `CMD` et `ENTRYPOINT` <u>doivent</u> être écrites dans le format "exec" ([voir la documentation de l'instruction `CMD`](https://docs.docker.com/reference/dockerfile/#cmd))

Pour bénéficier de l'expansion de paramètre avec l'instruction `CMD` dans sa forme "exec", il va falloir explicitement lancer un shell :

```dockerfile
FROM busybox:latest
ARG APP
# …
CMD ["/bin/sh", "-c", "echo $APP"]
```

Après un nouveau build, voici le résultat :

```sh
docker run --rm app-frontend
# 
```

Plus d'erreur donc, mais aucun output… Ceci vient d'une confusion entre les instructions `ARG` et `ENV`. Les variables définies avec `ARG` sont à destination du builder, elles ne seront donc pas préservées lorsqu'on lance un conteneur avec `docker run`. Ce qui signifie dans notre cas que, bien que l'expansion de paramètres soit à présent bien gérée, la variable `$APP` n'existe pas dans le conteneur. Les variables définies avec `ENV` quant à elles ne peuvent pas être transmises lors du `docker build`, mais seront bien préservées lors de l'exécution d'un conteneur. 

La solution est donc de récupérer la valeur de `$APP` grâce à l'instruction `ARG`, puis de la copier dans une variable d'environnement à l'aide d'une seconde instruction `ENV` :

```dockerfile
FROM busybox:latest
ARG APP
ENV APP=$APP
# …
CMD ["/bin/sh", "-c", "echo $APP"]
```

On rebuild, et voilà !

```sh
docker run --rm app-frontend
# frontend
```

## Liens

[Référence Dockerfile - Instruction ARG](https://docs.docker.com/reference/dockerfile/#arg)      
[Référence Dockerfile - Instruction CMD](https://docs.docker.com/reference/dockerfile/#cmd)      
[Référence Dockerfile - Instruction ENV](https://docs.docker.com/reference/dockerfile/#env)      


