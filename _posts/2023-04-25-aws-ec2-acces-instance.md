---
layout: post
title:  "AWS EC2 - Accéder à une instance"
date:   2023-04-25
tags:
- aws
- cdk
- devops
- python
description: >
  Comment se connecter à une instance EC2 ?
--- 

Cet article s'inscrit dans un dossier sur la gestion de machines EC2 avec AWS CloudFormation. Merci de bien lire la section [Introduction et disclaimers]({{ site.url }}/aws-ec2-ami#introduction-et-disclaimers) du premier article de ce dossier.

<aside><p>Articles du dossier :</p>
<p>
<a href="{{ site.url }}/aws-ec2-ami">I - Les AWS AMI</a><br>
<strong>II - Accéder à une instance EC2</strong><br>
<a href="{{ site.url }}/aws-ec2-cfn-init">III - Le script cfn-init</a><br>
<a href="{{ site.url }}/aws-ec2-cfn-get-metadata">IV - Le script cfn-get-metadata</a><br>
<a href="{{ site.url }}/aws-ec2-cfn-signal">V - Le script cfn-signal</a><br>
<a href="{{ site.url }}/aws-ec2-cfn-hup">VI - Le script cfn-hup</a>
</p></aside>

## Introduction

Les scripts que nous allons voir dans les articles suivants sont des utilitaires installés par défaut sur les instances EC2. Ce ne sont pas des scripts prévus pour être utilisés en local, mais bien depuis une instance. Avant de les étudier, il va donc falloir commencer par trouver un moyen de se connecter à notre nouvelle instance EC2.

Nous allons principalement aborder dans cet article des concepts réseau. Si vous n'êtes pas familier de ces concepts, je vous invite chaudement à lire [le guide de l'utilisateur d'AWS VPC](https://docs.aws.amazon.com/fr_fr/vpc/latest/userguide/what-is-amazon-vpc.html) (Virtual Private Cloud), qui est didactique et contient toutes les informations nécessaires pour appréhender le networking.

## Les sous-réseaux de VPC 

La première chose à vérifier est le sous-réseau (subnet) du VPC dans lequel nous avons déployé l'instance. L'instance ne peut être accessible depuis l'extérieur du VPC que si elle est déployée dans un sous-réseau public. Dans le cas contraire, il faudra obligatoirement un intermédiaire (comme un bastion) :

{:.center}
![Sous-réseaux VPC]({{ site.url }}/images/aws-ec2-acces-instance/vpc-subnets.png)

Dans notre cas nous n'avons rien spécifié dans le paramètre `vpc_subnets`, et par défaut (pour raisons de sécurité) les instances sont déployées dans les sous-réseau privés. Mais il se trouve que notre VPC ne contient qu'un seul sous-réseau et que celui-ci est public, l'instance est donc forcément au bon endroit :

```py
vpc = ec2.Vpc(self, "Vpc",
  subnet_configuration = [
    ec2.SubnetConfiguration(
      name = "public",
      subnet_type = ec2.SubnetType.PUBLIC,
      cidr_mask = 24)],
  max_azs = 1)
```

Dans le cas où vous avez aussi des sous-réseaux privés, faites bien attention à placer vos instances dans les bons sous-réseaux : 

```py
instance = ec2.Instance(self, "Instance",
  …
  vpc_subnets = ec2.SubnetSelection(
    subnet_type = ec2.SubnetType.PUBLIC))
```

## Les groupes de sécurité

Les groupes de sécurité permettent de contrôler le trafic entrant/sortant des ressources auxquelles ils sont associés. Ces groupes ont les règles suivantes établies par défaut :
- Aucun trafic entrant n'est autorisé
- Tout trafic sortant est autorisé

Il faut donc modifier le groupe de sécurité associé à notre instance pour autoriser notre adresse IP à accéder au port 22 (SSH). Par souci de simplicité, nous allons ici autoriser toutes les adresses IPv4, mais je vous recommande en temps normal de n'ajouter que les adresses concernées, particulièrement en ce qui concerne vos instances de production :

```py
security_group = ec2.SecurityGroup(self, "InstanceSecurityGroup",
  vpc = vpc)
security_group.add_ingress_rule(ec2.Peer.any_ipv4(), ec2.Port.tcp(22))

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
  security_group = security_group)
```

Lors du déploiement (`cdk deploy`) vous aurez l'avertissement suivant, vous indiquant que vous êtes sur le point d'ouvrir certains accès. Ce genre d'avertissement est très fréquent, et vous permet (dans une certaine mesure) d'éviter de dégrader la sécurité de votre VPC sans vous en rendre compte. Dans notre cas, le tableau correspond bien à ce que nous sommes en train de faire, on peut donc confirmer le déploiement.

```txt
Security Group Changes
┌───┬──────────────────────────────────┬─────┬────────────┬─────────────────┐
│   │ Group                            │ Dir │ Protocol   │ Peer            │
├───┼──────────────────────────────────┼─────┼────────────┼─────────────────┤
│ + │ ${InstanceSecurityGroup.GroupId} │ In  │ TCP 22     │ Everyone (IPv4) │
│ + │ ${InstanceSecurityGroup.GroupId} │ Out │ Everything │ Everyone (IPv4) │
└───┴──────────────────────────────────┴─────┴────────────┴─────────────────┘
```

Au passage, l'utilisation de groupes de sécurité n'engendre aucun coût chez AWS.

## Les paires de clés

Notre instance est donc à présent accessible sur le port 22, et comme pour toute connexion SSH il va nous falloir une clé. Nous allons créer cette clé via CDK, et la déployer sur notre instance :

```py
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
  key_name = cfn_key_pair.key_name)
```

Lançons la commande `cdk diff` pour voir ce que nous nous apprêtons à déployer :

```sh
cdk diff
# Stack WorkshopStack
# Resources
# [+] AWS::EC2::KeyPair KeyPair KeyPair
# [~] AWS::EC2::Instance Instance InstanceC1063A87   replace
#  └[+] KeyName (requires replacement)
#    └ ssh-key-workshop
```

<aside><p>Notez bien ici le flag <code>replace</code> en face de notre instance EC2. CDK nous alerte que l'instance va être détruite et remplacée par une nouvelle.</p></aside>

Il existe un certain nombre d'opérations qui provoquent une destruction de l'instance, en particulier ce qui a trait à ses volumes ou son type. Soyez toujours très attentif à ces flags, car un changement d'instance signifie un changement d'identifiant et d'adresse IP. Dans certains cas ces changements peuvent être critiques pour votre infrastructure, il faudra alors faire évoluer cette dernière afin par exemple d'utiliser une IP fixe, des DNS ou encore un Load Balancer…

Une fois ce changement déployé avec `cdk deploy`, on peut vérifier que l'identifiant de l'instance a bien changé, et récupérer en même temps son adresse IP publique :

```sh
aws ec2 describe-instances \
  --region eu-west-3 \
  --filter "Name=vpc-id,Values=vpc-002eb550de44ebcba" \
  | jq '{
      "logical-id": .Reservations[0].Instances[0].Tags[] | 
        select(.Key == "aws:cloudformation:logical-id").Value,
      "ip": .Reservations[0].Instances[0].PublicIpAddress
    }'
# {
#   "logical-id": "InstanceC1063A87",
#   "ip": "13.36.244.227"
# }
```

Pour faciliter la suite des opérations et éviter d'avoir à lancer cette grosse commande dès que l'on veut les récupérer, nous allons ajouter deux `CfnOutput` qui permettront d'afficher ces deux informations dès que la commande `cdk deploy` est terminée :

```py
from aws_cdk import CfnOutput

# Affiche l'identifiant logique de l'instance
CfnOutput(self, "InstanceLogicalId",
  value = instance.instance.logical_id)

# Affiche l'adresse IP publique de l'instance
CfnOutput(self, "InstancePublicIp",
  value = instance.instance_public_ip)
```

On relance un deploy, et voici le résultat :

```sh
# Outputs:
# WorkshopStack.InstanceLogicalId = InstanceC1063A87
# WorkshopStack.InstancePublicIp = 13.36.244.227
```

Quand une paire de clé est créée via CloudFormation, la clé privée est stockée dans un AWS Systems Manager Parameter Store, mais il est tout à fait possible d'utiliser une clé existante si vous les gérez d'une autre manière. Nous allons utiliser quelques commandes afin d'aller récupérer l'identifiant de notre nouvelle paire de clés, puis pour télécharger la partie privée de la clé : 

```sh
aws ec2 describe-key-pairs \
  --region eu-west-3 \
  --filters Name=key-name,Values=ssh-key-workshop \
  --query "KeyPairs[0].KeyPairId"
# "key-0777a9ddb1f0adcdf"
aws ssm get-parameter \
  --region eu-west-3 \
  --name /ec2/keypair/key-0777a9ddb1f0adcdf \
  --with-decryption \
  --query Parameter.Value \
  --output text \
  > ssh-key-workshop.pem
```

N'oubliez pas de changer les droits du fichier `ssh-key-workshop.pem` pour qu'il ne soit accessible que par vous, sans quoi vous aurez une belle erreur `WARNING: UNPROTECTED PRIVATE KEY FILE!` qui vous empêchera de vous connecter :

```sh
chmod 400 ssh-key-workshop.pem
```

## Connexion SSH

Nous avons enfin toutes les informations nécessaires ! Sur une instance Amazon Linux, l'utilisateur par défaut pour se connecter est `ec2-user` (ce sera `ubuntu` pour les instances Ubuntu), on peut donc lancer la commande suivante pour se connecter sur notre instance :

```sh
ssh -i ssh-key-workshop.pem ec2-user@13.36.244.227

#        __|  __|_  )
#        _|  (     /   Amazon Linux 2 AMI
#       ___|\___|___|

# https://aws.amazon.com/amazon-linux-2/
# [ec2-user@ip-10-0-0-221 ~]$
```

Vous pouvez au passage voir qu'en plus de son adresse IP publique (utilisée pour les trafics provenant de l'extérieur du VPC), l'instance a aussi une adresse privée (ici `10.0.0.221`). C'est cette adresse qui sera utilisée au sein du réseau VPC. Il est très important de garder en tête l'existence de ces deux adresses, vous aurez à les utiliser dès lors que vous chercherez à faire dialoguer plusieurs ressources au sein de votre VPC.

## EC2 Instance Connect

Il est aussi possible de se connecter à votre instance directement depuis l'AWS Console. Dans les pages du service EC2, trouvez votre instance et vous verrez un bouton "Se connecter". En cliquant dessus vous aurez plusieurs méthodes de connexion disponibles, la plus simple reste encore "EC2 Instance Connect" :

{:.center}
![Interface de EC2 Instance Connect]({{ site.url }}/images/aws-ec2-acces-instance/ec2-instance-connect.png)

Un simple clic vous ouvrira un shell interactif via le service AWS CloudShell, comme si vous aviez vous-même ouvert une connexion SSH. 

## Conclusion

Pour pouvoir accéder à une instance EC2, nous avons donc vu qu'il faut un certain nombre de choses :
- L'instance doit être déployée dans un sous-réseau public
- Son groupe de sécurité doit autoriser le trafic entrant sur le port 22
- Une paire de clé RSA/ED25519 doit être définie et utilisée par l'instance
- La clé privée doit être présente sur votre environnement local, avec les bons droits
- Il faut avoir récupéré l'adresse IP de l'instance

Cela peut faire un peu peur au début, mais le networking dans le cloud c'est surtout de la sécurité. Il faut prendre le temps de comprendre à quoi sert chaque élément, l'ensemble n'est au final pas si compliqué que cela.

Dans les prochains articles nous allons enfin pouvoir aborder les 4 scripts CloudFormation de gestion des instances EC2 !

## Liens

[Référence AWS - Guide de l'utilisateur d'AWS VPC](https://docs.aws.amazon.com/fr_fr/vpc/latest/userguide/what-is-amazon-vpc.html)   
[Référence AWS - Création de paires de clés](https://docs.aws.amazon.com/fr_fr/AWSEC2/latest/UserGuide/create-key-pairs.html)    
[Référence AWS CDK - EC2::Instance](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_ec2/Instance.html)    
[Référence AWS CDK - EC2::SecurityGroup](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_ec2/SecurityGroup.html)    
[Référence AWS CDK - EC2::CfnKeyPair](https://docs.aws.amazon.com/cdk/api/v2/python/aws_cdk.aws_ec2/CfnKeyPair.html)    
[Référence AWS CLI - ec2 describe-key-pairs](https://docs.aws.amazon.com/cli/latest/reference/ec2/describe-key-pairs.html)    
[Référence AWS CLI - ssm get-parameter](https://docs.aws.amazon.com/cli/latest/reference/ssm/get-parameter.html)    
