---
layout: post
title:  "AWS EC2 - Le script cfn-hup"
date:   2023-05-23
tags:
- aws
- cdk
- devops
- python
description: >
  Comment déclencher des mise à jour automatiques de vos instances EC2, suite à un changement de template CloudFormation ?
--- 

Cet article s'inscrit dans un dossier sur la gestion de machines EC2 avec AWS CloudFormation. Merci de bien lire la section [Introduction et disclaimers]({{ site.url }}/aws-ec2-ami#introduction-et-disclaimers) du premier article de ce dossier. 

<aside><p>Articles du dossier :</p>
<p>
<a href="{{ site.url }}/aws-ec2-ami">I - Les AWS AMI</a><br>
<a href="{{ site.url }}/aws-ec2-acces-instance">II - Accéder à une instance EC2</a><br>
<a href="{{ site.url }}/aws-ec2-cfn-init">III - Le script cfn-init</a><br>
<a href="{{ site.url }}/aws-ec2-cfn-get-metadata">IV - Le script cfn-get-metadata</a><br>
<a href="{{ site.url }}/aws-ec2-cfn-signal">V - Le script cfn-signal</a><br>
<strong>VI - Le script cfn-hup</strong>
</p></aside>

## Introduction

<aside><p>Les scripts CloudFormation sont préinstallés sur les instances Amazon Linux. Pour les autres plate-formes, veuillez vous référer à <a href="https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/cfn-helper-scripts-reference.html#cfn-helper-scripts-reference-downloads">la documentation</a> pour les installer.</p></aside>

## Le script `cfn-hup`

"HUP" est un raccourci pour "Hang UP", qui est un héritage de la déjà lointaine époque des ports séries et du [signal SIGHUP](https://en.wikipedia.org/wiki/SIGHUP). Ce signal était utilisé pour indiquer la fermeture d'une ligne de communication série. Aujourd'hui le SIGHUP est surtout utilisé pour forcer les daemons à se redémarrer eux-mêmes, afin qu'ils puissent re-lire les fichiers de configuration.

Contrairement aux scripts que nous avons vus précédemment `cfn-hup` est en effet un script daemon. Il vous faudra le lancer une première fois lors de la création de l'instance, puis il s'exécutera en arrière-plan. Ce script va détecter les modifications apportées aux méta-données de vos instances (dans votre template CloudFormation), et va vous permettre de déclencher des actions en réaction à ces changements.

<aside><p>L'ajout et la modification des méta-données de vos ressources n'a absolument aucun impact sur vos instances. Il est nécessaire d'avoir un mécanisme pour exécuter les commandes décrites dans ces méta-données (le role de <code>cfn-init</code>), et un autre pour détecter les changements qui y sont apportés (le role de <code>cfn-hup</code>).</p></aside>

On pourrait penser que `cfn-hup` est superflu, et qu'il suffit de lancer `cfn-init` régulièrement via un cron. C'est vrai dans les cas les plus simplistes, mais cette technique ne permet pas de répondre à la grande majorité des cas d'usages, nous verrons pourquoi dans la suite de cet article.

La mise en place de ce script va donc nécessiter plusieurs étapes :
- Le lancement du daemon
- La configuration de `cfn-hup` : quel template surveiller, et à quelle fréquence ?
- La configuration des hooks : quelles commandes lancer, et lors de quels événements ?

## Les jeux de configuration

Jusqu'ici nous avons toujours utilisé la clé `config` dans nos méta-données `AWS::CloudFormation::Init` afin de définir les commandes à lancer lors de la création de notre instance, mais à présent nous allons avoir un workflow un peu plus complexe :
- Une configuration pour Nginx 
- Une configuration pour `cfn-hup`

Notre objectif est que le serveur Nginx soit mis à jour automatiquement, on va donc vouloir lancer le premier ensemble de commandes à la création de l'instance, mais aussi lors de ses mises à jour. En revanche (pour l'exemple) nous souhaitons configurer `cfn-hup` une seule fois, lors de la création de l'instance. Nous allons donc avoir ce qu'on appelle deux jeux de configuration :
- Un jeu à lancer suite à la création de l'instance (configuration de Nginx et de `cfn-hup`)
- Un jeu à lancer suite à la mise à jour de l'instance (configuration de Nginx)

Pour répondre à ce besoin, les méta-données `AWS::CloudFormation::Init` supportent une clé `configSets` permettant de regrouper vos configurations dans des jeux (sets), afin de les lancer de manière indépendante. La clé `config` n'étant utilisée que si `configSets` n'est pas définie, nous allons commencer par renommer notre configuration `config` en `nginx`, pour ensuite ajouter la clé `configSets` :

```py
instance.instance.add_metadata("AWS::CloudFormation::Init", {
  "configSets": {
    "create": [
      "nginx"]},
  "nginx": {
    # Installation du package Nginx
    "commands": {
      "01-nginx-install": {
        "command": "sudo amazon-linux-extras install -y nginx1"}},
    # Activation du service Nginx
    "services": {
      "sysvinit": {
        "nginx": {
          "enabled": True,
          "ensureRunning": True,
          "files": [
            "/etc/nginx/nginx.conf",
            "/usr/share/nginx/html/index.html"]}}}}})
```

Pour récapituler ce changement, voici ce que nous avions avant :
- Une configuration appelée `config` (clé utilisée par défaut en l'absence de jeux de configuration)

Et voici ce que nous avons à présent :
- Un jeu de configuration appelé `create` 
- Une configuration appelée `nginx` (utilisé dans le jeu `create`)

Il faut aussi penser à modifier l'appel à `cfn-init`, pour préciser quel jeu de configuration nous désirons lancer :

```py
instance.add_user_data(dedent(f"""\
  (
    set +e
    /opt/aws/bin/cfn-init -v \
      --region eu-west-3 \
      --stack {self.stack_name} \
      --resource {instance.instance.logical_id} \
      --configsets create
    /opt/aws/bin/cfn-signal -e $? \
      --region eu-west-3 \
      --stack {self.stack_name} \
      --resource {instance.instance.logical_id}
  )"""))
```

Ce changement va nous permettre de mieux organiser nos configurations dans la suite de cet article, et je vous recommande de toujours utiliser les jeux de configuration ; ils permettent non seulement plus de souplesse pour vos évolutions futures, mais sont aussi beaucoup plus explicites et facilitent la lecture de ces configurations (très) verbeuses.

<aside><p>Ne lancez pas la commande <code>cdk deploy</code> pour le moment, nous allons faire pas mal de changements avant.</p></aside>

## Mise en place de `cfn-hup`

Maintenant que tout est propre nous allons créer une nouvelle configuration nommée `cfn-hup` (là-aussi, libre à vous de choisir le nom, il s'agit juste d'une clé), et l'ajouter au jeu de configuration `create` :

```py
instance.instance.add_metadata("AWS::CloudFormation::Init", {
  "configSets": {
    "create": [
      "nginx",
      "cfn-hup"]},
  "nginx": { … },
  "cfn-hup": {}})
```

Je vais à présent détailler les trois étapes évoquées pour la mise en place complète du script `cfn-hup`.

### Lancement du daemon

Comme pour Nginx, nous allons utiliser la clé `services.sysvinit` pour nous assurer que le daemon `cfn-hup` soit lancé. Celui-ci dépendra des deux fichiers suivants, que nous allons voir juste après :
- `/etc/cfn/cfn-hup.conf` : configuration du script
- `/etc/cfn/hooks.d/cfn-auto-reloader.conf` : configuration des hooks

```py
instance.instance.add_metadata("AWS::CloudFormation::Init", {
  "configSets": {… },
  "nginx": { … },
  "cfn-hup": {
    # Activation du service cfn-hup
    "services": {
      "sysvinit": {
        "cfn-hup": {
          "enabled": True,
          "ensureRunning": True,
          "files": [
            "/etc/cfn/cfn-hup.conf",
            "/etc/cfn/hooks.d/cfn-auto-reloader.conf"]}}}}})
```

### Configuration du script

Ici on va préciser quel est le template CloudFormation de référence, et avec quelle fréquence `cfn-hup` va devoir le surveiller. C'est le fichier `/etc/cfn/cfn-hup.conf` qui est chargé de définir tout cela (voir la [documentation](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/cfn-hup.html#cfn-hup-config-file) pour les spécifications), voici (pour des raisons de lisibilité) à quoi nous voulons qu'il ressemble :

```conf
[main]
stack=<StackId>  
region=eu-west-3
interval=5
verbose=true
```

On précise bien la stack à surveiller, ainsi qu'un intervale de 5 minutes entre chaque vérification. Voici le fichier ajouté aux méta-données de notre instance :

```py
instance.instance.add_metadata("AWS::CloudFormation::Init", {
  "configSets": {
    "create": [
      "nginx",
      "cfn-hup"]},
  "nginx": { … },
  "cfn-hup": {
    "files": {
      # Fichier de configuration de cfn-hup
      "/etc/cfn/cfn-hup.conf": {
        "content": dedent(f"""\
          [main]
          stack={self.stack_id}
          region=eu-west-3
          interval=5
          verbose=true"""),
        "encoding": "plain",
        "mode": "000400",
        "owner": "root",
        "group": "root"}},
    # Activation du service cfn-hup
    "services": {
      "sysvinit": {
        "cfn-hup": {
          "enabled": True,
          "ensureRunning": True,
          "files": [
            "/etc/cfn/cfn-hup.conf",
            "/etc/cfn/hooks.d/cfn-auto-reloader.conf"]}}}}})
```

### Configuration des hooks

Nous avons déjà demandé à `cfn-hup` de surveiller notre template CloudFormation, il faut à présent lui préciser quoi faire, et surtout quand. Le script fonctionne avec un système de hooks qui vont permettre d'écouter les événements suivants sur une ressource :
- `post.add` 
- `post.update` 
- `post.remove` 

C'est le fichier `/etc/cfn/hooks.d/cfn-auto-reloader.conf` qui contiendra cette configuration (voir la [documentation](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/cfn-hup.html#cfn-hup-hook-file) pour les spécifications), et une fois encore pour des raisons de lisibilité voici à quoi nous voulons qu'il ressemble : 

```conf
[cfn-auto-reloader-hook]
triggers=post.update
path=Resources.<InstanceId>.Metadata.AWS::CloudFormation::Init
action=/opt/aws/bin/cfn-init -v \
  --region eu-west-3 \
  --stack <StackId> \
  --resource <InstanceId> \
  --configsets update
runas=root
```

C'est ce fichier qui est le plus important, et qui dépendra beaucoup de ce que vous voulez faire. Ici on désire réagir aux événements de mise à jour des méta-données de notre instance. Quand cet événement survient on lance le script `cfn-init`, mais cette fois-ci en appelant un autre jeu de configuration nommé `update` (qu'il va falloir créer pour l'occasion). 

Voici le fichier ajouté aux méta-données de notre instance, ainsi que le changement des `configSets` :

```py
instance.instance.add_metadata("AWS::CloudFormation::Init", {
  "configSets": {
    "create": [
      "nginx",
      "cfn-hup"],
    "update": [
      "nginx"]},
  "nginx": { … },
  "cfn-hup": {
    "files": {
      # Fichier de configuration de cfn-hup
      "/etc/cfn/cfn-hup.conf": {
        "content": dedent(f"""\
          [main]
          stack={self.stack_id}
          region=eu-west-3
          interval=5
          verbose=true"""),
        "encoding": "plain",
        "mode": "000400",
        "owner": "root",
        "group": "root"},
      # Commandes à lancer lors d'un signal de mise à jour
      "/etc/cfn/hooks.d/cfn-auto-reloader.conf": {
        "content": dedent(f"""\
          [cfn-auto-reloader-hook]
          triggers=post.update
          path=Resources.{instance.instance.logical_id}.Metadata.AWS::CloudFormation::Init
          action=/opt/aws/bin/cfn-init -v \
            --region eu-west-3 \
            --stack {self.stack_id} \
            --resource {instance.instance.logical_id} \
            --configsets update
          runas=root"""),
        "encoding": "plain",
        "mode": "000400",
        "owner": "root",
        "group": "root"}},
    # Activation du service cfn-hup
    "services": {
      "sysvinit": {
        "cfn-hup": {
          "enabled": True,
          "ensureRunning": True,
          "files": [
            "/etc/cfn/cfn-hup.conf",
            "/etc/cfn/hooks.d/cfn-auto-reloader.conf"]}}}}})
```

<aside><p>Même si ce n'est pas le cas ici, il est tout à fait possible de réagir à des événements qui surviennent sur une autre ressource de la stack. C'est très utile pour prendre en compte automatiquement l'ajout et la suppression d'instances EC2 à un cluster, par exemple.</p></aside>

Nous pouvons à présent provisionner ces changements avec `cdk deploy`, et parce que nous avons modifié les données utilisateur, l'instance va à nouveau être remplacée. Profitez-en donc pour récupérer la nouvelle adresse IP publique :

```bash
# Outputs:
# WorkshopStack.InstanceLogicalId = InstanceC1063A87e4b92a55b80d62ff
# WorkshopStack.InstancePublicIp = 13.38.71.54
```

## Déploiement d'une modification

En accédant à notre serveur en HTTP sur la nouvelle adresse IP (http://13.38.71.54 dans mon exemple), on retrouve la page d'accueil par défaut de Nginx. Maintenant que `cfn-hup` est en place nous allons modifier cette page via les méta-données, et voir si ce changement est bien répercuté sur notre instance. Ajoutons une section `files` à notre configuration `nginx`, pour changer le contenu de cette page d'accueil :

```py
instance.instance.add_metadata("AWS::CloudFormation::Init", {
  "configSets": { … },
  "nginx": {
    # Installation du package Nginx
    "commands": {
      "01-nginx-install": {
        "command": "sudo amazon-linux-extras install -y nginx1"}},
    # Modification de la page par défaut de Nginx
    "files": {
      "/usr/share/nginx/html/index.html": {
        "content": "<title>Hello World</title><h1>Hello World</h1>",
        "mode": "000644",
        "owner": "root",
        "group": "root"}},
    # Activation du service Nginx
    "services": {
      "sysvinit": {
        "nginx": {
          "enabled": True,
          "ensureRunning": True,
          "files": [
            "/etc/nginx/nginx.conf",
            "/usr/share/nginx/html/index.html"]}}}},
  "cfn-hup": { … }})
```

En lançant la commande `cdk diff` on constate qu'il n'y a pas de changement d'instance prévu, juste un ajout de méta-données :

```sh
# Stack WorkshopStack
# Resources
# [~] AWS::EC2::Instance Instance InstanceC1063A87e4b92a55b80d62ff
#  └─ [~] Metadata
#      └─ [~] .AWS::CloudFormation::Init:
#          └─ [~] .nginx:
#              └─ [+] Added: .files
```

On lance donc `cdk deploy`. Vous pourrez voir que la mise à jour sera très rapide (une vingtaine de secondes) : comme expliqué en début d'article, une modification de méta-données n'a sur le moment aucune incidence sur notre instance, nous avons donc ajouté quelques lignes de texte dans un template CloudFormation, jusqu'ici rien de plus.

Au maximum 5 minutes plus tard, vous devriez voir cette nouvelle page d'accueil [au design dans le plus pur esprit du brutalisme](https://brutalist-web.design/) apparaître 🎉

{:.center}
![Notre nouvelle page Nginx]({{ site.url }}/images/aws-ec2-cfn-hup/nginx-nouvelle-page.png)

## Conclusion

Nous voila arrivés à la fin de ce dossier qui couvre les bases de la gestion d'instance EC2 avec CloudFormation. Sa rédaction aura pris beaucoup de temps, j'ai apporté un soin tout particulier à la stack CloudFormation et au code qui, je l'espère, devraient vous avoir permis de suivre l'ensemble des articles plus facilement en reproduisant toutes les opérations vous-mêmes.

Vous voici à présent en mesure de provisioner et configurer des instances EC2 sans aucune intervention manuelle. Il y aura très probablement d'autres articles sur EC2 dans le futur, qui s'attarderont plus en détails sur certaines techniques et/ou fonctionnalités, restez dans le coin…

## Liens

[Référence AWS - cfn-hup](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/cfn-hup.html)    
[Référence AWS - Jeux de configuration AWS::CloudFormation::Init](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/aws-resource-init.html#aws-resource-init-configsets)    
[Référence AWS - UpdateStack](https://docs.aws.amazon.com/AWSCloudFormation/latest/APIReference/API_UpdateStack.html)    
