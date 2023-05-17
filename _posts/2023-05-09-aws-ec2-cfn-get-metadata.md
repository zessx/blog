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

Cet article s'inscrit dans un dossier sur la gestion de machines EC2 avec AWS CloudFormation. Merci de bien lire la section [Introduction et disclaimers]({{ site.url }}/aws-ec2-ami#introduction-et-disclaimers) du premier article de ce dossier. Vous pouvez aussi retrouver l'intégralité du code utilisé en fin d'article.

<aside><p>Articles du dossier :</p>
<p>
<a href="{{ site.url }}/aws-ec2-ami">I - Les AWS AMI</a><br>
<a href="{{ site.url }}/aws-ec2-acces-instance">II - Accéder à une instance EC2</a><br>
<a href="{{ site.url }}/aws-ec2-cfn-init">III - Le script cfn-init</a><br>
<strong>IV - Le script cfn-get-metadata</strong><br>
<a href="{{ site.url }}/aws-ec2-cfn-signal">V - Le script cfn-signal</a><br>
<a href="{{ site.url }}/aws-ec2-cfn-hup">VI - Le script cfn-hup</a>
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

Cet article était un peu plus léger que les précédents, étant donné que nous avions déjà eu l'occasion de travailler avec les méta-données de notre instance. Le script `cfn-get-metadata` peut néanmoins s'avérer très utile dans des cas spécifiques, par exemple s'il vous faut déployer des flottes d'instances inter-connectées. Nous verrons dans la suite de ce dossier [comment gérer les erreurs qui peuvent survenir lors de la création de nos instances]({{ site.url }}/aws-ec2-cfn-signal), puis comment mettre à jour ces instances automatiquement pour qu'elles soient toujours à jour avec la dernière version de `AWS::CloudFormation::Init`.

<details>
<summary>Voir l'intégralité du code</summary>
<pre><code>from aws_cdk import (
  Stack,
  CfnOutput,
  aws_ec2 as ec2,
)
from constructs import Construct
from textwrap import dedent

class WorkshopStack(Stack):

  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)

    vpc = ec2.Vpc(self, "Vpc",
      subnet_configuration = [
        ec2.SubnetConfiguration(
          name = "public",
          subnet_type = ec2.SubnetType.PUBLIC,
          cidr_mask = 24)],
      max_azs = 1)

    security_group = ec2.SecurityGroup(self, "InstanceSecurityGroup",
      vpc = vpc)
    security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(22))
    security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(80))

    cfn_key_pair = ec2.CfnKeyPair(self, "KeyPair",
      key_name = "ssh-key-workshop",
      key_type = "ed25519")

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

    # Affiche l'identifiant logique de l'instance
    CfnOutput(self, "InstanceLogicalId",
      value = instance.instance.logical_id)

    # Affiche l'adresse IP publique de l'instance
    CfnOutput(self, "InstancePublicIp",
      value = instance.instance_public_ip)
</code></pre>
</details>

## Liens

[Référence AWS - cfn-get-metadata](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/cfn-get-metadata.html)    
[Référence AWS - Meta-données](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/metadata-section-structure.html)
