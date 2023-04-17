---
layout: post
title:  "AWS EC2 - Le script cfn-init"
date:   2023-05-02
tags:
- aws
- cdk
- devops
- python
- nginx
description: >
  Comment initialiser automatiquement vos nouvelles instances EC2 ?
--- 

Cet article s'inscrit dans un dossier sur la gestion de machines EC2 avec AWS CloudFormation. Merci de bien lire la section [Introduction et disclaimers]({{ site.url }}/aws-ec2-ami#introduction-et-disclaimers) du premier article de ce dossier.

<aside><p>Articles du dossier :</p>
<p>
<a href="{{ site.url }}/aws-ec2-ami">I - Les AWS AMI</a><br>
<a href="{{ site.url }}/aws-ec2-acces-instance">II - Accéder à une instance EC2</a><br>
<strong>III - Le script cfn-init</strong><br>
<a href="{{ site.url }}/aws-ec2-cfn-get-metadata">IV - Le script cfn-get-metadata</a><br>
<em>V - Le script cfn-signal</em><br>
<em>VI - Le script cfn-hup</em>
</p></aside>

## Introduction

<aside><p>Les scripts CloudFormation sont préinstallés sur les instances Amazon Linux. Pour les autres plate-formes, veuillez vous référer à <a href="https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/cfn-helper-scripts-reference.html#cfn-helper-scripts-reference-downloads">la documentation</a> pour les installer.</p></aside>

## Les étapes du provisioning

Quand on parle de provisionner une instance, on parle de la mettre à disposition de manière automatisée. Dans les articles précédents de ce dossier, nous avons vu comment créer une instance EC2 grâce à CloudFormation et CDK, et comment s'y connecter. Mais notre instance est vide, elle ne contient absolument que les packages, services et utilisateurs installés par défaut.

Il faut bien distinguer deux étapes dans le provisioning :
- L'allocation des ressources nécessaires (couche infrastructure : instance, volumes…)
- La configuration de l'instance (couche logicielle : packages, services, utilisateurs…)

Pour automatiser la première étape, on va se tourner vers des outils d'IaC (Infrastructure as Code) comme AWS CloudFormation, Terraform, Azure Resource Manager… Pour la seconde, on utilisera plutôt des outils de SCM (Software Configuration Management) comme Ansible, Chef, Puppet ou encore CFEngine.

Pour notre exemple, voyons comment mettre en place un simple serveur web (Nginx) sur notre instance. Nous avons utilisé CDK pour générer un template AWS CloudFormation et le déployer ; nous pourrions à présent créer un playbook Ansible pour installer Nginx et le configurer. La bonne nouvelle, c'est qu'il est tout à fait possible de faire cela sans outil supplémentaire !

## Le script `cfn-init`

Le script `cfn-init` est un utilitaire qui permet de configurer une instance EC2, et en particulier :
- d'installer des packages
- de créer des groupes et utilisateurs
- de télécharger et décompresser des archives
- d'enregistrer des fichiers sur le disque
- d'activer, désactiver, arrêter ou démarrer des services
- de lancer des commandes

Il repose sur le standard [cloud-init](https://cloud-init.io/) (comme les autres scripts que nous verrons dans les articles de ce dossier) et se base sur les méta-données `AWS::Cloudformation::Init` de l'instance, commençons donc par ajouter celles-ci pour installer Nginx :

```py
instance.instance.add_metadata("AWS::CloudFormation::Init", {
  "config": {
    # Installation du packages Nginx
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
            "/usr/share/nginx/html/index.html"]}}}
  }})
```

La syntaxe est un peu verbeuse en Python, mais assez claire. Chacune des clés (`packages`, `groups`, `users`, `sources`, `files`, `commands` et `services`) a ses propres paramètres, et je vous renvoie [à la documentation](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/aws-resource-init.html) pour les découvrir en détails (nous en parlerons peut-être dans un autre article). J'attire tout de même votre attention sur la clé `services.sysvinit.nginx.files` : le service sera redémarré si l'un de ces fichiers est modifié via le script `cfn-init`, nous y reviendrons plus tard.

Le diff nous indique bien que nous nous apprêtons à ajouter la clé `AWS::CloudFormation::Init` dans les méta-données de notre instance :

```sh
# Stack WorkshopStack
# Resources
# [~] AWS::EC2::Instance Instance InstanceC1063A87
#  └[~] Metadata
#    └[+] Added: .AWS::CloudFormation::Init
```

Procédons alors au déploiement, et connectons-nous ensuite à l'instance pour vérifier l'état du statut du service `nginx` (ouvrez cette session SSH dans un autre terminal, vous en aurez besoin plusieurs fois) :

```sh
ssh -i ssh-key-workshop.pem ec2-user@13.36.244.227
[ec2-user@ip-10-0-0-97 ~]$ systemctl is-enabled nginx
# Failed to get unit file state for nginx.service: No such file or directory
```

On constate que le service n'est pas lancé, et qu'il n'existe même pas. La raison est très simple : nous avons simplement ajouté des méta-données à notre instance, sans rien en faire. Au début de cette section je vous disais que le script `cfn-init` se base sur ces méta-données pour configurer une instance EC2, mais nous n'avons ici pas encore exécuté le script ! Commençons donc par récupérer l'identifiant logique de notre instance, qui sera nécessaire pour exécuter `cfn-init`, dans les output générés par CDK (voir [l'article précédent]({{ site.url }}/aws-ec2-acces-instance) pour la mise en place de ces outputs) :

```sh
# Outputs:
# WorkshopStack.InstanceLogicalId = InstanceC1063A87
# WorkshopStack.InstancePublicIp = 13.36.244.227
```

Retournons à présent sur notre session SSH pour exécuter le script. Afin de savoir quel jeu de méta-données exécuter, le script requiert trois informations : la région, la stack, et la ressource (que nous venons de récupérer). Pour que notre set de commandes de configuration fonctionne sans encombre, il sera nécessaire de lancer le script avec `sudo` :

```sh 
sudo /opt/aws/bin/cfn-init \
  --region eu-west-3 \
  --stack WorkshopStack \
  --resource InstanceC1063A87
systemctl is-enabled nginx
# enabled
```

Le service `nginx` est maintenant bien installé et activé ! Comme le serveur web est lancé, allons donc faire un tour sur `http://13.36.244.227` pour voir la page web par défaut de Nginx. Malheureusement, vous constaterez que la connexion ne se fait pas et que votre navigateur pédale dans le vide indéfiniment. C'est parce que nous n'avons pas autorisé le trafic entrant sur le port 80 (HTTP), comme ce que nous avons vu [précédemment]({{ site.url }}/aws-ec2-acces-instance) pour le port 22 il va falloir ajouter une règle sur notre groupe de sécurité :


```py
security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80))
```

Suite au provisionnement, vous pourrez enfin accéder à la page `http://13.36.244.227` :

{:.center}
![Page par défaut de Nginx]({{ site.url }}/images/aws-ec2-cfn-init/nginx-page-defaut.png)

## Automatiser la configuration des instances

L'instance est configurée, le serveur web est lancé et la page accessible en HTTP. C'est bien joli tout ça, mais nous avons lancé le script `cfn-init` à la main pour configuration l'instance. Pour automatiser cette partie il va falloir nous tourner vers les données utilisateur (user data). Cette fonctionnalité permet d'exécuter des commandes au lancement d'une instance, nous allons tout simplement y ajouter l'appel à `cfn-init` de la manière suivante (et modifier l'argument `user_data_causes_replacement`, nous y reviendrons):

```py
from textwrap import dedent

instance = ec2.Instance(self, "Instance",
  # Type d'instance : t2.micro
  instance_type = ec2.InstanceType.of(
    instance_class = ec2.InstanceClass.T2,
    instance_size = ec2.InstanceSize.MICRO),
  # AMI à utiliser
  machine_image = ec2.MachineImage.generic_linux({
    "eu-west-3": "ami-01fde5e5b31e98551"}),
  # VPC dans lequel déployer l'instance
  vpc = vpc,
  # Groupe de sécurité pour autoriser le trafic sur le port 22
  security_group = security_group,
  # SSH key to use
  key_name = cfn_key_pair.key_name,
  # Un changement de user-data doit provoquer un changement d'instance
  user_data_causes_replacement = True)

instance.add_user_data(dedent(f"""\
  /opt/aws/bin/cfn-init -v \
    --region eu-west-3 \
    --stack {self.stack_name} \
    --resource {instance.instance.logical_id}"""))
```

Lançons un `cdk diff` avant le déploiement pour voir ce qui va se passer :

```sh
# Stack WorkshopStack
# Resources
# [-] AWS::EC2::Instance InstanceC1063A87 destroy
# [+] AWS::EC2::Instance Instance InstanceC1063A871d26e4ad6d4f18b8
```

<aside><p>Notez bien ici le flag <code>destroy</code> en face de notre instance EC2. CDK nous alerte que l'instance va être détruite et remplacée par une nouvelle.</p></aside>

Comme précédemment, nous sommes dans une situation où l'instance va être remplacée. Cela tombe bien, car nous pourrons vérifier le cas échéant que la configuration de la nouvelle instance se fait bien automatiquement. Suite au déploiement, vérifions l'identifiant de notre instance :

```sh
# Outputs:
# WorkshopStack.InstanceLogicalId = InstanceC1063A871d26e4ad6d4f18b8
# WorkshopStack.InstancePublicIp = 13.38.58.10
```

L'identifiant logique a changé, il s'agit donc bien d'une nouvelle instance. Et si on essaye d'accéder à l'url `http://13.38.58.10` (l'IP de notre nouvelle instance), on retrouve bien la page par défaut de Nginx. Nous avons donc à présent une instance qui est provisionnée et configurée automatiquement, grâce au script `cfn-init` !

## Quelle différence entre `cfn-init` et `user data` ?

Pour arriver à nos fins, nous avons rajouté des commandes à deux endroits : dans la clé de méta-données `AWS::CloudFormation::Init`, et dans les données utilisateur. Mais alors si les deux approches permettent de configurer notre instance, pourquoi ne pas simplement tout mettre à un seul endroit ? La différence entre les deux approches est cruciale, et il vous faut absolument la comprendre pour prendre les bonnes décisions.

Les données utilisateur ne permettent que de faire du bootstrapping, les commandes ajoutées ici ne seront lancées qu'une seule et unique fois : lors de la création de l'instance. Plus important encore : tout changement dans ces données utilisateur risque de provoquer un remplacement de l'instance EC2. Pour des instances à durée de vie moyenne ou longue donc, faites très attention aux commandes que vous ajoutez ici. Deux précisions sur cette approche :
- Dans certains cas comme notre dernier exemple, l'identifiant logique de votre instance (`InstanceC1063A871d26e4ad6d4f18b8`) contiendra un hash hexadecimal à la fin (identifiable car en minuscules). Si c'est le cas, vous pouvez être sûr que votre instance sera détruite au moindre changement des données utilisateur. Ce hash dépend en effet des user data, et même l'ajout d'un simple espace provoquerait un changement du hash, donc un changement de l'identifiant logique, et donc un remplacement de l'instance.
- Vous aurez noté que j'ai forcé la valeur de `user_data_causes_replacement` à `True`, je l'ai fait pour vous présenter ce mécanisme de remplacement d'instance. Très important, la valeur par défaut de cet argument n'est pas toujours `False`, cela dépend de la définition ou non de `init_options`. Pour éviter les surprises, je vous invite à toujours le définir explicitement.

Les méta-données `AWS::CloudFormation::Init` permettent aussi de faire du bootstrapping, via le lancement du script `cfn-init` (exactement comme dans notre exemple). Les deux avantages de ce script par rapport aux données utilisateur est qu'il peut être lancé plusieurs fois pour faire des mises à jour sur vos instances via CloudFormation (nous verrons ceci dans un autre article de ce dossier), et qu'un changement de ces méta-données ne risquera jamais de provoquer une suppression de l'instance courante.

Dans la grande majorité des cas, vous utiliserez les deux approches en même temps :
- `AWS::CloudFormation::Init` pour la configuration de votre instance
- Les données utilisateur, uniquement pour déclencher les scripts `cfn-*` (dont `cfn-init`)

## Conclusion

Nous arrivons à présent à déployer des instances fonctionnelles, c'est un bon pas en avant ! Dans la suite de ce dossier, nous verrons comment accéder facilement aux méta-données de nos ressources, et comment gérer les erreurs pouvant survenir lors de la configuration de nos instances.

## Liens

[cloud-init - La norme pour la personnalisation des instances cloud](https://cloud-init.io/)
[Référence AWS - cfn-init](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/cfn-init.html)    
[Référence AWS - AWS::CloudFormation::Init](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/aws-resource-init.html)    
[Référence AWS - Lancer des commandes au lancement de votre instance](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html)    
[Référence AWS - Méta-données d'instance et données utilisateur](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html)    
