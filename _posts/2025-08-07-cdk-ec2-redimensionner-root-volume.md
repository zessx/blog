---
layout: post
title:  "Redimensionner le root volume d'une instance EC2 avec CDK"
date:   2025-08-07
tags:
- aws
- cdk
- devops
- python
description: >
  Astuce pour éviter le remplacement d'une instance EC2 dans une stack CloudFormation, lors du redimensionnement de son root volume.
--- 

## Prérequis et disclaimer

Cet article suppose que vous avez déjà :
- Une stack CloudFormation en place, gérée avec CDK
- Un VPC avec ses sous-réseaux et groupes de sécurité, pour placer une instance
- Une paire de clé SSH à utiliser pour vous connecter à une instance

Les ressources que nous allons créer seront de petite taille, mais vont malgré tout engendrer des coûts minimes (environ 30 centimes par jour). Je veillerai à n'utiliser que des ressources disponibles dans [l'offre gratuite d'AWS](https://aws.amazon.com/fr/ec2/pricing/?loc=ft#Free_tier). Il reste de votre responsabilité de surveiller ces coûts, et surtout de supprimer les ressources créées si vous n'en avez plus l'utilité. L'utilisation d'une stack CloudFormation permettra une suppression simple rapide de toutes ces ressources.

Pour plus d'information sur la mise en place d'une stack CDK et de comment se connecter à une instance, veuillez vous référer à mes articles précédents [AWS EC2 - Les AMI]({{ site.url }}/aws-ec2-ami) et [AWS EC2 - Accéder à une instance]({{ site.url }}/aws-ec2-acces-instance).

## Setup

Pour mes examples je vais créer une instance EC2 avec Amazon Linux 2, je commence donc par récupérer une AMI récent :

```sh
aws ec2 describe-images --filters "Name=name,Values=amzn2-ami-hvm*arm*" \
  | jq '.Images[] | "\(.Name): \(.ImageId)"' | sort | tail -n 1

# "amzn2-ami-hvm-2.0.20250804.1-arm64-gp2: ami-09a7462832366034b"
```

Comme nous allons en avoir besoin pour la suite, je vais récupérer le mapping de volumes configuré par défaut sur cette AMI. Ici, le root volume EBS fait par défaut 8 Go et sera monté sur `/dev/xvda` :

```sh
aws ec2 describe-images --region eu-west-3 --image-ids ami-09a7462832366034b \
  | jq '.Images[0].BlockDeviceMappings[0]'

# {
#   "Ebs": {
#     "DeleteOnTermination": true,
#     "SnapshotId": "snap-0a46deebb131f0e21",
#     "VolumeSize": 8,
#     "VolumeType": "gp2",
#     "Encrypted": false
#   },
#   "DeviceName": "/dev/xvda"
# }
```

Je peux à présent utiliser CDK pour créer mon instance de test. Vous noterez que je surcharge directement la taille du root volume, tout en veillant à respecter le `device_name` par défaut :

```py
instance = ec2.Instance(self, "TestRootVolume",
    instance_name = "TestRootVolume",

    # VPC existant (non couvert par cet article)
    vpc = vpc,
    # Assurez-vous que vous pouvez vous connecter en SSH à votre instance (non couvert par cet article)
    vpc_subnets = ec2.SubnetSelection(
        subnet_type = ec2.SubnetType.PUBLIC
    ),
    key_pair = ec2.KeyPair.from_key_pair_name(stack, "TestRootVolumeKeyPair",
        key_pair_name = "test-root-volume-key"
    ),

    # Type d'instance
    instance_type = ec2.InstanceType.of(
        instance_class = ec2.InstanceClass.T4G,
        instance_size = ec2.InstanceSize.NANO
    ),
    machine_image = ec2.MachineImage.generic_linux(
        {"eu-west-3": "ami-09a7462832366034b"}
    ),

    # Configuration des volumes
    block_devices = [
        ec2.BlockDevice(
            device_name = "/dev/xvda",
            volume = ec2.BlockDeviceVolume.ebs(10)
        )
    ],
)
```

Un petit `cdk deploy` et le setup est terminé !

## Vérifier la taille du volume depuis l'instance

Nous voici à présent en conditions pour tester le redimensionnement de notre volume. Avant de le modifier, connectez-vous à l'instance pour vérifier sa taille (cela me permet d'introduire deux commandes donc nous aurons besoin plus tard) :

```sh
ssh -i test-root-volume-key.pem ec2-user@123.45.67.89

# Liste les block devices
lsblk
# NAME          MAJ:MIN RM SIZE RO TYPE MOUNTPOINT
# nvme0n1       259:0    0  10G  0 disk
# ├─nvme0n1p1   259:1    0  10G  0 part /
# └─nvme0n1p128 259:2    0  10M  0 part /boot/efi

# Affiche des information sur le file system
df -h
# Filesystem        Size  Used Avail Use% Mounted on
# devtmpfs          178M     0  178M   0% /dev
# tmpfs             215M     0  215M   0% /dev/shm
# tmpfs             215M  420K  214M   1% /run
# tmpfs             215M     0  215M   0% /sys/fs/cgroup
# /dev/nvme0n1p1     10G  1.7G  8.4G  17% /
# /dev/nvme0n1p128   10M  3.8M  6.2M  38% /boot/efi
# tmpfs              43M     0   43M   0% /run/user/1000
```

On peut voir que notre volume EBS est exposé sous forme de NVMe bloc, et que le file system utilise bien les 10 Go configurés plus tôt.

## Redimensionner le root volume : une opération destructrice ?

Le plus tentant, c'est évidemment d'aller modifier directement la taille ici :

```py
block_devices = [
    ec2.BlockDevice(
        device_name = "/dev/xvda",
        volume = ec2.BlockDeviceVolume.ebs(15)
    )
]
```

Avant de déployer ça, vérifions ce que CDK nous raconte :

```sh
cdk diff

# Resources
# [~] AWS::EC2::Instance TestRootVolume TestRootVolume215594D9 may be replaced
#  └─ [~] BlockDeviceMappings (may cause replacement)
#      └─ @@ -2,7 +2,7 @@
#         [ ]   {
#         [ ]     "DeviceName": "/dev/xvda",
#         [ ]     "Ebs": {
#         [-]       "VolumeSize": 10
#         [+]       "VolumeSize": 15
#         [ ]     }
#         [ ]   }
#         [ ] ]
```

Ici, un warning doit absolument vous interpeller : `AWS::EC2::Instance may be replaced`. En l'état, je ne sais pas si le prochain déploiement CDK va remplacer ou non mon instance. [La documentation de CloudFormation](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-ec2-instance.html#cfn-ec2-instance-blockdevicemappings) me renseigne un peu plus :

> After the instance is running, you can modify only the `DeleteOnTermination` parameter for the attached volumes without interrupting the instance. Modifying any other parameter results in instance replacement.

Je suis en train d'essayer de modifier le paramètre `VolumeSize`, ce qui va donc causer un remplacement de mon instance. Comment faire pour agrandir ce volume sans changer d'instance ?

## Le plan

Ce remplacement est causé non pas par EC2 directement, mais par CloudFormation. Le plan pour mettre à jour le volume va être le suivant :
1. Sortir l'instance EC2 (et ses dépendances) de la stack CloudFormation
2. Mettre à jour le volume via l'AWS CLI/Console
3. Étendre le file system manuellement
4. Réimporter l'instance EC2 (et ses dépendances) dans la stack CloudFormation

## Sortir (temporairement) de CloudFormation

Commentons le code CDK utilisé pour créer l'instance, et vérifions ce que cela impliquerait :

```sh
cdk diff

# Resources
# [-] AWS::IAM::Role TestRootVolume/InstanceRole TestRootVolumeInstanceRole97186823 destroy
# [-] AWS::IAM::InstanceProfile TestRootVolume/InstanceProfile TestRootVolumeInstanceProfile4F6747BA destroy
# [-] AWS::EC2::Instance TestRootVolume TestRootVolume215594D9 destroy
```

Notre objectif ici est de s'assurer que ces ressources seront préservées une fois sortie de la stack CloudFormation. Pour cela, nous allons dé-commenter le code et ajouter des politiques de rétention sur chaque ressource :

```py
from aws_cdk import RemovalPolicy

instance = ec2.Instance( … )

instance.apply_removal_policy(RemovalPolicy.RETAIN)
instance.role.apply_removal_policy(RemovalPolicy.RETAIN)
for child in instance.node.children:
    if  isinstance(child, iam.CfnInstanceProfile):
        child.apply_removal_policy(RemovalPolicy.RETAIN)
```

Comme le profile d'instance n'est pas accessible via le constructeur L2 `ec2.Instance`, on se permet d'aller le chercher au niveau L1 en fouillant dans les `node.children`. On peut vérifier que les identifiants des ressources sont les bons : 

```sh
cdk diff

# Resources
# [~] AWS::IAM::Role TestRootVolume/InstanceRole TestRootVolumeInstanceRole97186823
#  ├─ [+] DeletionPolicy
#  │   └─ Retain
#  └─ [+] UpdateReplacePolicy
#      └─ Retain
# [~] AWS::IAM::InstanceProfile TestRootVolume/InstanceProfile TestRootVolumeInstanceProfile4F6747BA
#  ├─ [+] DeletionPolicy
#  │   └─ Retain
#  └─ [+] UpdateReplacePolicy
#      └─ Retain
# [~] AWS::EC2::Instance TestRootVolume TestRootVolume215594D9
#  ├─ [+] DeletionPolicy
#  │   └─ Retain
#  └─ [+] UpdateReplacePolicy
#      └─ Retain
```

Lançons ce premier déploiement avec `cdk deploy`, puis retentons de commenter tout notre code (la définition de l'instance, et les politiques de rétention). Notez bien comme toutes les ressources ne sont plus marquées avec `destroy`, mais avec `orphan` ; CloudFormation nous indique que ces ressources vont être préservées (grace à leur politique de rétention), mais ne feront plus partie de la stack :

```sh
cdk diff

# Resources
# [-] AWS::IAM::Role TestRootVolume/InstanceRole TestRootVolumeInstanceRole97186823 orphan
# [-] AWS::IAM::InstanceProfile TestRootVolume/InstanceProfile TestRootVolumeInstanceProfile4F6747BA orphan
# [-] AWS::EC2::Instance TestRootVolume TestRootVolume215594D9 orphan
```

Lancez `cdk deploy` pour appliquer ce changement.

## Mettre à jour le volume manuellement

À l'aide de l'identifiant de votre instance, récupérez l'identifiant de son root volume, puis modifiez le volume :

```sh
INSTANCE_ID="i-00000000000000000"
VOLUME_ID=$(\
  aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].BlockDeviceMappings[0].Ebs.VolumeId' \
    --output text)
aws ec2 modify-volume --volume-id $VOLUME_ID --size 15
```

Vous pouvez patienter quelques minutes pour que la modification soit appliquée, et les optimisations apportées.

## Étendre le file system

Si on relance les deux commandes précédemment utilisées, on va pouvoir constater que le changement de taille a été détecté, mais que la partition et le file system n'utilisent pas les 5 Go supplémentaires. Il va falloir pour cela faire une extension de la partition et du file system :

```sh
lsblk
# NAME          MAJ:MIN RM SIZE RO TYPE MOUNTPOINT
# nvme0n1       259:0    0  15G  0 disk
# ├─nvme0n1p1   259:1    0  10G  0 part /
# └─nvme0n1p128 259:2    0  10M  0 part /boot/efi

df -h
# Filesystem        Size  Used Avail Use% Mounted on
# devtmpfs          178M     0  178M   0% /dev
# tmpfs             215M     0  215M   0% /dev/shm
# tmpfs             215M  420K  214M   1% /run
# tmpfs             215M     0  215M   0% /sys/fs/cgroup
# /dev/nvme0n1p1     10G  1.7G  8.4G  17% /
# /dev/nvme0n1p128   10M  3.8M  6.2M  38% /boot/efi
# tmpfs              43M     0   43M   0% /run/user/1000

# Extension de la partition
sudo growpart /dev/nvme0n1 1

lsblk
# NAME          MAJ:MIN RM SIZE RO TYPE MOUNTPOINT
# nvme0n1       259:0    0  15G  0 disk
# ├─nvme0n1p1   259:1    0  15G  0 part /
# └─nvme0n1p128 259:2    0  10M  0 part /boot/efi

# Extension du file system
sudo xfs_growfs /dev/nvme0n1p1

df -h
# Filesystem        Size  Used Avail Use% Mounted on
# devtmpfs          178M     0  178M   0% /dev
# tmpfs             215M     0  215M   0% /dev/shm
# tmpfs             215M  420K  214M   1% /run
# tmpfs             215M     0  215M   0% /sys/fs/cgroup
# /dev/nvme0n1p1     15G  1.7G   14G  12% /
# /dev/nvme0n1p128   10M  3.8M  6.2M  38% /boot/efi
# tmpfs              43M     0   43M   0% /run/user/1000
```

<aside><p>Selon le file system présent sur votre instance, il est possible que vous ayez à utiliser une autre command que <code>xfs_growfs</code>, comme <code>resize2fs</code>. Référez-vous à la documentation de l'AMI et du système d'exploitation utilisé pour savoir laquelle utiliser.</p></aside>

## Réimporter l'instance dans la stack CloudFormation

Maintenance que nos changements sont effectués, il ne reste plus qu'à réimporter l'instance dans la stack CloudFormation. Pour ce faire, dé-commentons une dernière fois tout le code, et assurons-nous qu'il représente l'état <b>ACTUEL</b> de l'instance (c'est à dire, avec les politiques de rétention, et le volume à 15 Go) :

```py
from aws_cdk import RemovalPolicy

instance = ec2.Instance(self, "TestRootVolume",
    instance_name = "TestRootVolume",

    # VPC existant (non couvert par cet article)
    vpc = vpc,
    # Assurez-vous que vous pouvez vous connecter en SSH à votre instance (non couvert par cet article)
    vpc_subnets = ec2.SubnetSelection(
        subnet_type = ec2.SubnetType.PUBLIC
    ),
    key_pair = ec2.KeyPair.from_key_pair_name(stack, "TestRootVolumeKeyPair",
        key_pair_name = "test-root-volume-key"
    ),

    # Type d'instance
    instance_type = ec2.InstanceType.of(
        instance_class = ec2.InstanceClass.T4G,
        instance_size = ec2.InstanceSize.NANO
    ),
    machine_image = ec2.MachineImage.generic_linux(
        {"eu-west-3": "ami-09a7462832366034b"}
    ),

    # Configuration des volumes
    block_devices = [
        ec2.BlockDevice(
            device_name = "/dev/xvda",
            volume = ec2.BlockDeviceVolume.ebs(15)
        )
    ],
)

instance.apply_removal_policy(RemovalPolicy.RETAIN)
instance.role.apply_removal_policy(RemovalPolicy.RETAIN)
for child in instance.node.children:
    if  isinstance(child, iam.CfnInstanceProfile):
        child.apply_removal_policy(RemovalPolicy.RETAIN)
```

Plutôt que de lancer un déploiement, nous allons lancer la commande `cdk import` et lui fournir tous les identifiants qu'elle demande :

```sh
# Instance::InstanceId
INSTANCE_ID="i-00000000000000000"

# InstanceProfile::InstanceProfileName
aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].IamInstanceProfile.Arn' \
    --output text

# InstanceRole::RoleName
INSTANCE_PROFILE_ID=$( \
  aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --query 'Reservations[0].Instances[0].IamInstanceProfile.Id' \
    --output text)
aws iam list-instance-profiles \
  --query "InstanceProfiles[?InstanceProfileId=='$INSTANCE_PROFILE_ID'].Roles[0].RoleName" \
  --output text

cdk import
# MyStack/TestRootVolume/InstanceRole/Resource (AWS::IAM::Role): enter RoleName (empty to skip) …
# MyStack/TestRootVolume/InstanceProfile (AWS::IAM::InstanceProfile): enter InstanceProfileName (empty to skip) …
# MyStack/TestRootVolume/Resource (AWS::EC2::Instance): enter InstanceId (empty to skip) …
```

Et voilà !

Votre instance est de retour dans la stack CloudFormation, avec une nouvelle taille de root volume.

## Liens

[Référence CloudFormation - AWS::EC2::Instance](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/TemplateReference/aws-resource-ec2-instance.html)    
[Référence EC2 - Volumes root pour vos EC2 instances Amazon](https://docs.aws.amazon.com/fr_fr/AWSEC2/latest/UserGuide/RootDeviceStorage.html)    
[Référence EBS - Volumes Amazon EBS et NVMe](https://docs.aws.amazon.com/fr_fr/ebs/latest/userguide/nvme-ebs-volumes.html)    
[Référence CDK - cdk import](https://docs.aws.amazon.com/fr_fr/cdk/v2/guide/ref-cli-cmd-import.html)    
