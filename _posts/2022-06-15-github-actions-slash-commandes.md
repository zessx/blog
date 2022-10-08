---
layout: post
title:  "Créer des commandes slash pour votre dépôt Github"
date:   2022-06-16
tags:
- devops
- git
description: >
  Introduction aux GitHub Actions : comment créer des commandes slash ?
---

## Les GitHub Actions

Les GitHub Actions sont la plateforme de CI/CD proposée par GitHub. Il s'agit de l'équivalent de Jenkins, GitLab CI/CD, AWS CodePipeline ou encore Azure DevOps pour les principaux concurrents.

En résumé, elles vous permettent d'automatiser vos builds, vos tests et vos déploiements. Les GitHub Actions permettent cependant d'aller un peu plus loin que leurs concurrents, notamment grâce à leur intégration forte avec la plateforme d'hébergement de code GitHub. Vous pouvez ainsi automatiser des actions en réaction à des événements qui surviennent dans votre dépôt GitHub.

Un *Event* va déclencher un ou plusieurs *Workflows* prédéfinis. Chaque *Workflow* va exécuter une suite de *Jobs* (des scripts) sur un même *Runner* (un serveur). Un *Job* est une suite logique de commandes à exécuter, qui peuvent elles-mêmes être réunies dans une *Action* afin d'être réutilisées facilement.

## Les déclencheurs de workflow

Il existe [de nombreux déclencheurs](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows) pour les workflow GitHub, dont voici les plus communs :
- `issue_comment` : nouveau commentaire créé ou modifié (sur une Issue ou une Pull Request)
- `issues` : une nouvelle activité sur une Issue
- `pull_request` : une nouvelle activité sur une Pull Request
- `push` : un nouveau commit (ou tag) poussé

Chacun de ces déclencheurs peut exposer des types, qui vous permettrons de filtrer les événements qui vous intéressent. Quelques exemples avec le déclencheur `issues` :
- `issues :: opened`
- `issues :: edited`
- `issues :: deleted`
- `issues :: labeled`
- `issues :: assigned`
- …

## Exemple de mise en place

Pour cet exemple, nous allons nous intéresser au déclencheur `issue_comment`, avec pour objectif de détecter une commande slash `/ping` dans les nouveaux commentaires et d'y répondre par un autre commentaire `Pong`.

Dans votre dépôt GitHub, commencez par créer le fichier qui va contenir le code du workflow :

```sh
mkdir -p .github/workflows
touch .github/workflows/issues_commands.yml
```

Et voici le code du workflow, à placer dans le fichier en question :

{% raw %}
```yaml
# Nom du workflow, apparaîtra dans les logs
name: Issues commands

# Déclencheur, ici toute création de commentaire,
# sur une Issue ou une Pull Request
on:
  issue_comment:
    types: [created]

# Liste des jobs à exécuter
jobs:
  ping:
    name: Command /ping
    # On récupère le contenu du commentaire grâce au contexte `github`
    if: ${{ endsWith(github.event.comment.body, '/ping') }}
    # Le type de Runner sur lequel exécuter ce job
    runs-on: ubuntu-latest
    steps:
      # Les commandes à exécuter
      - name: Response to the command
        # Ici on utilise GitHub CLI pour commenter l'Issue
        run: gh issue comment $ISSUE --body "Pong"
        env:
          # Token d'authentification requis par GitHub CLI
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ISSUE: ${{ github.event.issue.html_url }}
```
{% endraw %}

La syntaxe YAML est assez simple à comprendre, ici nous n'utilisons aucune GitHub Action externe, tout le code est stocké dans le dépôt. Pour information, GitHub CLI est installé par défaut sur les *Runners*, afin de vous permettre de travailler plus rapidement et facilement.

## Démonstration

Pour que votre *Workflow* soit pris en compte, il doit être publié dans GitHub :

```sh
git add .github
git commit -m "Setup GitHub Workflow"
git push origin main
```

Une fois publié, vous pouvez le tester en ouvrant une Issue, puis en ajoutant un commentaire se terminant par `/ping`. Après quelques secondes, vous devriez voir le bot `github-actions` vous répondre 🎉 :

{:.center}
![Commentaire du GitHub Bot]({{ site.url }}/images/github-actions-slash-commandes/github-bot-comment.png)

## Les étapes

Vous aurez noté que notre *Job* contient un *Step* :

```yaml
jobs:
  ping:
    name: Command /ping
    …
    steps:
      - name: Response to the command
        …
```

Les *Steps* sont avant tout un moyen d'organiser toutes les commandes à exécuter, ils réagissent comme les *Jobs* et supportent d'ailleurs les mêmes clés que ces derniers (pour la plupart). Voyez-les comme un niveau de granularité supplémentaire dans vos *Workflows*, vous comprendrez rapidement à l'usage quand les utiliser.

## Les expressions

{% raw %}
Attardons-nous sur la condition `if: ${{ endsWith(github.event.comment.body, '/ping') }}`, qui contient une *Expression*.
{% endraw %}

Les *Expressions* permettent de définir des variables et d'accéder à des *Contexts* (plus d'informations à ce sujet dans la suite de cet article) en utilisant des valeurs littérales, des opérateurs, des références et/ou des fonctions. Elles sont habituellement utilisées comme dans notre exemple : afin de déterminer si un *Job* (ou un *Step*) doit être exécuté ou non.

Les opérateurs classiques sont disponibles, ainsi qu'un certain nombre de fonctions utiles comme :
- `contains()`
- `startsWith()`
- `endsWith()`
- `success()` (qui permet de savoir si tous les *Steps* précédents sont passés sans erreur)
- `failure()` (qui permet de savoir si au moins un *Step* précédent a retourné une erreur)
- `cancelled()` (qui permet de savoir si le *Workflow* a été annulé)

Dans notre exemple, on choisit de n'exécuter le *Job* que si la valeur de la variable de *Context* `github.event.comment.body` termine par `/ping` (techniquement, vous pouvez donc écrire un commentaire classique, tout en terminant pas la commande).

## Les contextes

Les *Contexts* sont une part importante dans la rédaction des workflows, car ils contiennent énormément d'informations utiles, voire nécessaires. Dans notre exemple, nous utilisons les *Contexts* suivants :
- `github` : contient des informations sur l'exécution du *Workflow*, et en particulier des variables comme `github.actor`, `github.event` ou `github.ref`
- `secrets` : contient les variables secrètes définies pour le *Workflow* (voir dans GitHub, `Settings > Secrets > Actions`)

D'autres *Contexts* sont disponibles, comme `env`, `job`, `steps` pour les plus utilisés. Prenez le temps de lire leur documentation afin de trouver de nouvelles manières d'utiliser les GitHub Actions !

## GitHub Token vs. Personal Access Token

Avant de finir cet article d'introduction aux GitHub Actions, je pense qu'il est important d'attirer votre attention sur les lignes suivantes :

{% raw %}
```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```
{% endraw %}

Vous avez besoin d'un token d'authentification pour interagir avec les API de GitHub. Pour chaque dépôt, un `GITHUB_TOKEN` est automatiquement créé et disponible dans vos *Workflows* via le **Context* `secrets`. Cependant et selon ce que vous voulez faire, les permissions de ce token peuvent s'avérer insuffisantes.

[Par défaut](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token), le `GITHUB_TOKEN` aura des droits de lecture/écriture sur le dépôt, pour tous les scopes (`actions`, `issues`, `pull-requests`…). Vous pouvez supprimer les droits d'écriture par défaut dans les paramètre de votre dépôt (`Settings > Actions > General > Workflow permissions`), pour ensuite affiner les droits dans votre fichier YAML avec la clé suivante (qui peut être placée à la racine, ou dans un job) :

```yaml
permissions:
  actions: read|write|none
  checks: read|write|none
  contents: read|write|none
  deployments: read|write|none
  id-token: read|write|none
  issues: read|write|none
  discussions: read|write|none
  packages: read|write|none
  pages: read|write|none
  pull-requests: read|write|none
  repository-projects: read|write|none
  security-events: read|write|none
  statuses: read|write|none
```

Si vous avez besoin d'autres types de permissions, comme par exemple accéder aux informations de l'organisation (et ses Teams, People et Projects), il vous sera impossible d'utiliser le `GITHUB_TOKEN` (qui est rappelons-le, un token de dépôt). Pour cela vous devrez utiliser un Personal Access Token (PAT), lié à un utilisateur. Les deux différences majeures avec l'autre type de token sont :
- un PAT a les permissions de l'utilisateur auquel il est lié (ce qui peut avoir des implications en terme de sécurité)
- les actions effectuées via un PAT le seront au nom de l'utilisateur en question (et non plus au nom du bot `github-action`)

Vous pouvez générer un PAT [dans les paramètres de votre compte GitHub](https://github.com/settings/tokens) (`Settings > Developer Settings > Personal access tokens`), pensez à le nommer en fonction de son usage et à ne lui donner que les permissions nécessaires. Rappelez-vous que ce token permet d'accéder aux API de GitHub en votre nom, soyez avares sur les permissions.

Une fois généré, placez ce PAT dans les secrets de votre dépôt (`Settings > Secrets > Actions`) sous le nom `PERSONAL_ACCESS_TOKEN` afin de le récupérer dans votre *Workflow* :

{% raw %}
```yaml
env:
  GITHUB_TOKEN: ${{ secrets.PERSONAL_ACCESS_TOKEN }}
```
{% endraw %}

Et voilà, vous avez à présent toutes les informations nécessaires pour commencer à expérimenter avec les GitHub Action !

## Liens

[Documentation GitHub Actions](https://docs.github.com/en/actions)
[Documentation GitHub Actions - Les expressions](https://docs.github.com/en/actions/learn-github-actions/expressions)
[Documentation GitHub Actions - Les contextes](https://docs.github.com/en/actions/learn-github-actions/contexts)
[Documentation GitHub Actions - Les permissions du GITHUB_TOKEN](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#permissions-for-the-github_token)
[Manuel de GitHub CLI](https://cli.github.com/manual/)
