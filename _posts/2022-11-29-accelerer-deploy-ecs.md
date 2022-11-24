---
layout: post
title:  "Accélérer les déploiements ECS"
date:   2022-11-29
tags:
- aws
- cdk
- devops
- python
description: >
  Quelques pistes d'amélioration pour accélérer vos déploiements sur ECS.
--- 

AWS ECS (Elastic Container Service) laisse une grande latitude pour configurer les déploiements, afin de répondre à un maximum de besoin possible. Malgré tout, la plupart des réglages définissant ces déploiements ont des valeurs par défaut, afin de faciliter l'utilisation du service. Si vous n'avez jamais étudié plus profondément la documentation, il y a de fortes chances pour que certaines choses ne soient pas réglées à votre avantage. 

Vous trouverez dans cet article plusieurs pistes à étudier, qui vous permettront peut-être d'accélérer vos déploiements sur ECS.

## L'image Docker

Commençons par le plus évident : plus votre image est lourde, et plus elle prendra de temps à être récupérée par les nouvelles tâches. Pour gagner un peu de temps sur le téléchargement, vous pouvez commencer par :
- Réduire la taille de votre image Docker, en utilisant par exemple des bases alpines ou en réduisant les layers
- Vous assurer que l'image est déposée sur ECR dans la même région AWS que la tâche qui va l'utiliser
- Utiliser des tâches avec plus de vCPUs

Concernant la mise en cache de l'image, tout dépend de ce que vous utilisez :
- Pour les tâches EC2, vous pouvez choisir de passer la variable `ECS_IMAGE_PULL_BEHAVIOR` à `prefer-cached` afin de bénéficier du cache par défaut
- Pour les tâches Fargate, il n'y a [pour le moment](https://github.com/aws/containers-roadmap/issues/696) aucun mécanisme de mise en cache des images

Voici déjà un bon début, mais qui sera surtout utile dans le cas où vous lancez un grand nombre de tâches. 

## Les paramètres de déploiement

La manière dont vous avez configuré les variables suivantes peut avoir une incidence sur la durée des déploiements :
- Le pourcentage maximum de tâches saines (`max_healthy_percent`)
- Le pourcentage minimum de tâches saines (`min_healthy_percent`)

Prenez un service avec 100 tâches en temps normal (`desired_count`). Si vous définissez respectivement ces valeurs à 110 et 90, le déploiement va se faire par lots de 20 tâches, contre 60 tâches par lot avec des valeurs de 150 et 90.

```py
# Exemple de paramétrage des déploiements avec CDK
service = aws_ecs_patterns.ApplicationLoadBalancedFargateService(self, "Service",
  task_definition = …,
  desired_count = 10,
  max_healthy_percent = 200,
  min_healthy_percent = 50)
```

## Le Circuit Breaker

Cette section vous concerne surtout si vous avez des chances non négligeables qu'un déploiement échoue. Sans réglage de votre part, vous risquez de tomber dans une boucle de déploiement infinie, où de nouvelles tâches seront créées sans arrêt, mais ne survivront pas suffisamment longtemps pour être considérées comme saines. 

Dans ces cas de figure, vos déploiements vont mettre plusieurs heures avant de finalement être annulés. La mise en place d'un Circuit Breaker permet de détecter les déploiements en échec, et de lancer un rollback beaucoup plus rapidement.

```py
# Exemple de paramétrage d'un Circuit Breaker avec CDK
service = aws_ecs_patterns.ApplicationLoadBalancedFargateService(self, "Service",
  task_definition = …,
  circuit_breaker = aws_ecs.DeploymentCircuitBreaker(rollback = True))
```

Pour plus d'informations sur cette fonctionnalité, [voir l'article dédié à ce sujet](https://blog.smarchal.com/ecs-deployment-circuit-breaker).

## Le healthcheck

Pendant le déploiement, les nouvelles tâches lancées vont être surveillées afin de vérifier qu'elles sont saines. Ce mécanisme est appelé le healthcheck, et il est bon de savoir que vous avez la possibilité de le configurer selon vos besoins. Par défaut une vérification sera effectuée toutes les 30 secondes, et sera considérée comme un échec sans réponse dans les 5 secondes (10 si vous utilisez un Network Load Balancer, ou du HTTPS). La tâche elle-même sera considérée comme saine ou non après un certain nombre de succès ou d'échecs.

En connaissant bien votre application, vous pouvez réduire certaines de ces valeurs afin d'accélérer la détection des tâches saines. Attention toutefois à ne pas faire trop de zèle en laissant passer toutes les tâches, l'intérêt du healthcheck ici est bien d'éviter de déployer une version instable de votre application.

<aside><p>La configuration du mécanisme de healthcheck doit être faite en prenant en compte les spécificités de votre application. Ne recopiez pas de valeurs "magiques" trouvées sur Internet sans les comprendre.</p></aside>


```py
# Exemple de paramétrage du healthcheck avec CDK
service = aws_ecs_patterns.ApplicationLoadBalancedFargateService(self, "Service",
  task_definition = …)
service.target_group.configure_health_check(
  path = "/healthcheck",
  interval = Duration.seconds(5), 
  timeout = Duration.seconds(4),
  healthy_threshold_count = 2,
  unhealthy_threshold_count = 3)
```

## Le drainage des connexions

Autre piste d'amélioration, et non des moindres… Nous avons déjà évoqué le système de déploiement "par lot" d'ECS, et il faut le comprendre un peu plus en détail pour comprendre l'intérêt de ce réglage. Lorsqu'une tâche est supprimée (pour faire de la place à une autre) d'un cluster ECS, voici ce qui se passe :
1. La tâche est supprimée des cibles du load balancer, afin qu'elle ne reçoive plus aucune connexion entrante
2. Un certain délai est laissé pour que les connexions en cours se terminent : c'est la phase de drainage
3. Une fois ce délai passé, un `SIGTERM` est envoyé à la tâche, afin de lui donner la possibilité de couper proprement
4. Après un autre délai et si la tâche est toujours en cours, un `SIGKILL` lui est envoyé, afin de forcer son arrêt

Par défaut, le délai de drainage des connexions est fixé à 5 minutes. Là aussi, il faut bien connaître votre application, mais si vous savez par exemple qu'elle répond systématiquement en moins de 30 secondes, vous pouvez facilement baisser ce délai pour accélérer le drainage. Attention à ne pas descendre trop bas, sans quoi vous causerez la coupure brutale d'un certain nombre de connexions en cours ; vous êtes seul juge pour décider si ces coupures sont critiques ou non.

```py
# Exemple de paramétrage de la période de grâce du healthcheck avec CDK
service = aws_ecs_patterns.ApplicationLoadBalancedFargateService(self, "Service",
  task_definition = …)
service.target_group.set_attribute("deregistration_delay.timeout_seconds", "30")
```

<aside><p>Dans le cas d'un service qui ne reçoit aucun trafic de l'extérieur, vous pouvez parfaitement descendre le délai à 0 seconde. Toutefois, cela signifie probablement que vous n'avez même pas besoin de Load Balancer, voyez peut-être pour passer d'un `aws_ecs_patterns.ApplicationLoadBalancedFargateService` à un simple `ecs.FargateService`, ça représentera quelques économies.</p></aside>

## La réaction à `SIGTERM`

Nous avons évoqué dans la section précédente la réaction aux signaux `SIGTERM` et `SIGKILL` ; par défaut le second est envoyé 30 secondes plus tard. Si vos tâches mettent un certain temps à se couper (une fois la phase de drainage terminée), pensez à vérifier si ce délai n'a pas été changé, via la variable `ECS_CONTAINER_STOP_TIMEOUT`. Si c'est bien le cas, votre application semble ne pas bien réagir au signal `SIGTERM`, et il y a peut-être quelque chose à corriger de ce côté.

## Liens

[Documentation AWS - Configuration de l'agent ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs-agent-config.html#image_pull)   
[Documentation AWS - Bonnes pratiques sur le déploiement de tâches ECS](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/service-options.html)   
[Documentation AWS - Bonnes pratiques pour accélérer les déploiement ECS](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/deployment.html)   
[Documentation AWS - Les Target Groups pour les Application Load Balancers](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html)   
[Documentation AWS - Stopper proprement une tâche ECS](https://aws.amazon.com/fr/blogs/containers/graceful-shutdowns-with-ecs/)   
[Référence AWS - ECS DeploymentConfiguration](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_DeploymentConfiguration.html)   

