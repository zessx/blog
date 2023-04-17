---
layout: post
title:  "AWS EC2 - Le script cfn-signal"
date:   2023-05-16
tags:
- aws
- cdk
- devops
- python
description: >
  Comment gérer les erreurs lors du provisioning de vos instances EC2 ?
--- 

Cet article s'inscrit dans un dossier sur la gestion de machines EC2 avec AWS CloudFormation. Merci de bien lire la section [Introduction et disclaimers]({{ site.url }}/aws-ec2-ami#introduction-et-disclaimers) du premier article de ce dossier.

<aside><p>Articles du dossier :</p>
<p>
<a href="{{ site.url }}/aws-ec2-ami">I - Les AWS AMI</a><br>
<a href="{{ site.url }}/aws-ec2-acces-instance">II - Accéder à une instance EC2</a><br>
<a href="{{ site.url }}/aws-ec2-cfn-init">III - Le script cfn-init</a><br>
<a href="{{ site.url }}/aws-ec2-cfn-get-metadata">IV - Le script cfn-get-metadata</a><br>
<strong>V - Le script cfn-signal</strong><br>
<a href="{{ site.url }}/aws-ec2-cfn-hup">VI - Le script cfn-hup</a>
</p></aside>

## Introduction

<aside><p>Les scripts CloudFormation sont préinstallés sur les instances Amazon Linux. Pour les autres plate-formes, veuillez vous référer à <a href="https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/cfn-helper-scripts-reference.html#cfn-helper-scripts-reference-downloads">la documentation</a> pour les installer.</p></aside>

## Le script `cfn-signal`

Le script `cfn-signal` permet d'envoyer un signal à CloudFormation pour indiquer qu'une instance EC2 a été créée (ou mise à jour) avec succès. Pour comprendre son intérêt, modifions les données utilisateur de l'instance définie [dans un article précédent]({{ site.url }}/aws-ec2-cfn-init) pour lancer `cfn-init` sur une ressource inexistante :

```py
instance.add_user_data(dedent(f"""\
  /opt/aws/bin/cfn-init -v \
    --region eu-west-3 \
    --stack {self.stack_name} \
    --resource dummy-resource"""))
```

Lancez le deploy, et voici ce que vous aurez à la fin :

```sh
#  ✅  WorkshopStack
#
# ✨  Deployment time: 12.51s
#
# Outputs:
# WorkshopStack.InstanceLogicalId = InstanceC1063A875535845ddfc6dc98
# WorkshopStack.InstancePublicIp = 52.47.137.9
# […]
#
# ✨  Total time: 18.83s
```

Si l'on en croit CDK et CloudFormation, il semble que tout se soit bien passé ! En effet, la création de l'instance EC2 est une réussite (vous pouvez vérifier qu'elle existe bien), ce qui est par défaut suffisant pour que la mise à jour de la stack CloudFormation soit un succès. Mais attention : ceci ne veut pas dire que vos scripts de configuration se sont terminés avec succès. Ils peuvent avoir échoué, voire même être encore en cours d'exécution.

<aside><p>Le succès de la création d'une ressource n'est (par défaut) pas corrélé au succès de sa configuration.</p></aside>

Dans notre cas, on sait que la configuration a forcément échoué, puisque la ressource `dummy-resource` n'existe pas. Et si on accède à la nouvelle adresse IP (en HTTP), on pourra facilement constater que le serveur Nginx ne tourne pas.

C'est là que le script `cfn-signal` entre en jeu : il vous permet de signaler s'il faut considérer le provisioning de l'instance comme étant un succès ou non. Nous allons voir dans cet article comment le mettre en place et l'utiliser correctement.

## La `CreationPolicy`

Concrètement le script `cfn-signal` ne fait qu'envoyer un signal, cela peut être (principalement) une notification de succès ou un exit code. Mais pour qu'il serve à quelque chose, ce signal doit être interprété. Cette interprétation, c'est la `CreationPolicy` (ou `UpdatePolicy` selon les cas) qui va s'en charger en écoutant les signaux envoyés par une instance, afin de savoir quand cette dernière est configurée.

Une `CreationPolicy` va tout simplement définir un certain nombre de signaux à recevoir (vous pouvez en envoyer un unique, ou bien un par service par exemple), ainsi qu'un temps imparti pour recevoir tous ces signaux. Dès lors qu'une `CreationPolicy` est assignée à une instance, la mise à jour de la stack `CloudFormation` va se mettre en pause et patienter jusqu'à savoir si l'instance est bien créée. Si ce n'est pas le cas, la mise à jour sera considérée comme un échec et la stack sera rollback à son état initial (si possible).

## Mise en place 

Ajoutons pour commencer un signal à la fin de nos données utilisateur. Le format `( set -e … )` est ici pour s'assurer que le script `cfn-signal` ne sera pas lancé si une commande précédente échoue (ici l'appel à `cfn-init`). Pour que CloudFormation prenne bien ce signal en compte, il faut aussi ajouter une `CreationPolicy` sur notre instance, comme nous venons de l'expliquer. Ici nous allons spécifier qu'un seul signal est attendu, et ce dans une limite de 5 minutes. On laisse aussi volontairement le `dummy-resource` afin de voir comment la mise à jour réagit :

```py
from aws_cdk import (
  CfnCreationPolicy,
  CfnResourceSignal,
)

instance.add_user_data(dedent(f"""\
  (
    set +e
    /opt/aws/bin/cfn-init -v \
      --region eu-west-3 \
      --stack {self.stack_name} \
      --resource dummy-resource
    /opt/aws/bin/cfn-signal -e $? \
      --region eu-west-3 \
      --stack {self.stack_name} \
      --resource {instance.instance.logical_id}
  )"""))

cfn_instance = instance.node.default_child
cfn_instance.cfn_options.creation_policy = CfnCreationPolicy(
  resource_signal = CfnResourceSignal(
    count = 1,
    timeout = "PT5M"))
```

On lance le deploy, et vous devriez le voir mouliner pendant 5 petites minutes avant d'avoir le message d'erreur suivant :

```sh
# 20:14:16 | CREATE_FAILED   | AWS::EC2::Instance   | InstanceC1063A87d0de1e9e47ebe230
# Failed to receive 1 resource signal(s) within the specified duration
```

CloudFormation vous informe que dans le temps imparti (5 minutes à notre demande), aucun signal n'a été reçu pour cette instance. Sa création est donc considérée comme un échec, et la stack est rollback. Si vous ne connaissez pas la raison de cet échec, vous pouvez vous rendre sur l'AWS Console pour consulter les logs système :

{:.center}
![Accéder aux logs système d'une instance EC2]({{ site.url }}/images/aws-ec2-cfn-signal/ec2-journal-systeme.png)

Corrigeons à présent l'erreur et relançons un deploy :

```py
instance.add_user_data(dedent(f"""\
  (
    set +e
    /opt/aws/bin/cfn-init -v \
      --region eu-west-3 \
      --stack {self.stack_name} \
      --resource {instance.instance.logical_id}
    /opt/aws/bin/cfn-signal -e $? \
      --region eu-west-3 \
      --stack {self.stack_name} \
      --resource {instance.instance.logical_id}
  )"""))
```

<!-- -->

```sh
#  ✅  WorkshopStack
#
# ✨  Deployment time: 118.97s
#
# Outputs:
# WorkshopStack.InstanceLogicalId = InstanceC1063A876aa52632e3e99aa7
# WorkshopStack.InstancePublicIp = 13.38.81.125
# […]
#
# ✨  Total time: 125.84s
```

Voilà qui est mieux ! Nous sommes à présent sûrs que lorsque le deploy passe, nos instances sont bien déployées et configurées. Vous aurez noté en passant que le temps de deploy s'est allongé : nous sommes en effet passés d'une vingtaine de secondes à environ 2 minutes. C'est l'effet de la `CreationPolicy`, qui provoque comme expliqué ci-dessus une mise en pause du deploy le temps de s'assurer que l'instance est configurée.

## Conclusion

À ce stade, vous avez toutes les clés nécessaires pour déployer et configurer automatiquement vos instances EC2. Il ne nous reste plus qu'à aborder la mise à jour automatique de ces instances, ce sera l'objet du prochain et dernier article de ce dossier.

## Liens

[Référence AWS - cfn-signal](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/cfn-signal.html)    
[Référence AWS - CreationPolicy](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/aws-attribute-creationpolicy.html)    
[Guide AWS - Déploiement d'app sur EC2 avec CloudFormation](https://docs.aws.amazon.com/fr_fr/AWSCloudFormation/latest/UserGuide/deploying.applications.html)    
[Wikipedia - ISO 8601](https://fr.wikipedia.org/wiki/ISO_8601)    
