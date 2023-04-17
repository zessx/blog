---
layout: post
title:  "AWS EC2 - Le script cfn-get-metadata"
date:   2023-05-09
tags:
- aws
- cdk
- devops
- python
description: >
  Comment récupérer les méta-données de vos instances EC2 ?
--- 

Cet article s'inscrit dans un dossier sur la gestion de machines EC2 avec AWS CloudFormation. Merci de bien lire la section [Introduction et disclaimers]({{ site.url }}/aws-ec2-ami#introduction-et-disclaimers) du premier article de ce dossier.

<aside><p>Articles du dossier :</p>
<p>
<a href="{{ site.url }}/aws-ec2-ami">I - Les AWS AMI</a><br>
<a href="{{ site.url }}/aws-ec2-acces-instance">II - Accéder à une instance EC2</a><br>
<a href="{{ site.url }}/aws-ec2-cfn-init">III - Le script cfn-init</a><br>
<strong>IV - Le script cfn-get-metadata</strong><br>
<em>V - Le script cfn-signal</em><br>
<em>VI - Le script cfn-hup</em>
</p></aside>

## Introduction

<aside><p>Les scripts CloudFormation sont préinstallés sur les instances Amazon Linux. Pour les autres plate-formes, veuillez vous référer à <a href="https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/cfn-helper-scripts-reference.html#cfn-helper-scripts-reference-downloads">la documentation</a> pour les installer.</p></aside>

## Le script `cfn-get-metadata`

Nous avons vu dans l'article précédent comment ajouter des méta-données sur une instance. Et bien sans surprise, le script `cfn-get-metadata` permet de récupérer ces méta-données ! Sans plus attendre, voici un exemple avec notre instance actuelle :

```sh
sudo /opt/aws/bin/cfn-get-metadata \
  --region eu-west-3 \
  --stack WorkshopStack \
  --resource InstanceC1063A871d26e4ad6d4f18b8
# {
#   "AWS::CloudFormation::Init": {
#     "config": {
#       "services": {
#         "sysvinit": {
#           "nginx": {
#             "files": [
#               "/etc/nginx/nginx.conf",
#               "/usr/share/nginx/html/index.html"
#             ],
#             "ensureRunning": "true",
#             "enabled": "true"
#           }
#         }
#       },
#       "commands": {
#         "01-nginx-install": {
#           "command": "sudo amazon-linux-extras install -y nginx1"
#         }
#       }
#     }
#   },
#   "aws:cdk:path": "WorkshopStack/Instance/Resource"
# }
```

On peut retrouver la clé `AWS::CloudFormation::Init` que nous avons définie et qui a été utilisée par le script `cfn-init`. 

Mais ce n'est pas la seule clé disponible, on peut aussi y voir la clé `aws:cdk:path`. Cette clé peut être utilisée pour retrouver l'instance plus facilement dans votre fichier local `cdk.out/tree.json`. On peut aussi ajouter dans ces méta-données d'autres clés comme `AWS::CloudFormation::Designer`, utilisée comme son nom l'indique par le service [CloudFormation Designer](https://console.aws.amazon.com/cloudformation/designer), ou toute autre clé arbitraire dont vous auriez besoin pour gérer vos ressources.

Dernière précision : vous pourriez être tentés de remplacer les valeurs des arguments pour récupérer des méta-données d'autres ressources. C'est en effet possible, comme on peut le voir ici avec les méta-données du VPC (je vous laisse trouver vous-mêmes comment récupérer l'identifiant de votre VPC, histoire de vous familiariser avec l'AWS CLI) :

```sh
sudo /opt/aws/bin/cfn-get-metadata \
  --region eu-west-3 \
  --stack WorkshopStack \
  --resource Vpc8378EB38
# {
#   "aws:cdk:path": "WorkshopStack/Vpc/Resource"
# }
```

Pour des raisons de sécurité, il ne sera bien évidemment possible que de récupérer les méta-données de ressources dans la stack où se trouve notre instance (là où nous lançons la commande). Pour contourner cette limitation, il vous faudra fournir des arguments `--access-key`, `--secret-key`, `--role`, ou `--credential-file`, avec les permissions nécessaires.

## Conclusion

Cet article était un peu plus léger que les précédents, étant donné que nous avions déjà eu l'occasion de travailler avec les méta-données de notre instance. Le script `cfn-get-metadata` peut néanmoins s'avérer très utile dans des cas spécifiques, par exemple s'il vous faut déployer des flottes d'instances inter-connectées. Nous verrons dans la suite de ce dossier comment gérer les erreurs qui peuvent survenir lors de la création de nos instances, puis comment mettre à jour ces instances automatiquement pour qu'elles soient toujours à jour avec la dernière version de `AWS::CloudFormation::Init`.

## Liens

[Référence AWS - cfn-get-metadata](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/cfn-get-metadata.html)    
[Référence AWS - Meta-données](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/metadata-section-structure.html)
