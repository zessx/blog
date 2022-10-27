---
layout: post
title:  "ECS Deployment Circuit Breaker"
date:   2022-11-08
tags:
- aws
- cdk
- devops
- python
description: >
  Présentation d'une fonctionnalité intéressante d'ECS, permettant de détecter les déploiements en échec.
--- 

## Amazon ECS

Amazon Elastic Container Service (ECS) est le service de gestion de conteneurs natif d'AWS, qui se repose sur des instances EC2 ou bien sur Fargate pour du serverless. C'est un équivalent de Kubernetes, qui est d'ailleurs aussi proposé par AWS as-a-service sour le nom EKS.

Vous avez donc un ou plusieurs services déployés avec ECS, chacun d'eux faisant tourner un certain nombre de conteneurs, utilisant tous vos images Docker (probablement déposées dans un dépôt ECR).

## Le déploiement en rolling update

Voyons à présent ce qu'il se passe lorsque vous voulez mettre à jour l'image utilisée par vos conteneurs. ECS supporte actuellement trois types de déploiement :
- Rolling update
- Blue/Green
- Externe (pour utiliser un autre gestionnaire de déploiement)

Le type de déploiement en place par défaut est le rolling update, nous allons voir dans les grande lignes comment il fonctionne, mais il est avant tout essentiel de comprendre les trois principaux paramètres sur lesquels celui-ci repose :
- Le nombre de tâches désirées (`desired_count`)
- Le pourcentage maximum de tâches saines (`max_healthy_percent`)
- Le pourcentage minimum de tâches saines (`min_healthy_percent`)

Dans le contexte d'un service ECS, une tâche est une exécution d'un conteneur avec un certains nombres de paramètres prédéfinis (variables d'environnement, CPU ou mémoire allouée, image Docker à utiliser…). Ces paramètres sont définis dans ce qu'on appelle une définition de tâche. Une tâche est considérée comme saine à partir du moment où son mécanisme de healthcheck ne retourne pas d'erreur. La plupart du temps, il s'agit d'une route `GET /healthcheck` qui doit retourner un code 200 ; si votre application plante, la route n'est plus accessible, et le healthcheck échoue.

`desired_count` représente simplement le nombre de tâches que vous voulez lancer en parallèle, en temps normal. Nous prendrons pour la suite de cet article une valeur d'exemple de 12.

`max_healthy_percent` représente le nombre maximum de tâches (en pourcentage de `desired_count`) que l'on autorise à lancer pendant un déploiement. Par défaut, ce paramètre est à 200%, ce qui signifie dans notre exemple que nous autorisons jusqu'à 24 tâches lancées pendant un déploiement. 

`min_healthy_percent` représente le nombre minimum de tâches lancées (en pourcentage de `desired_count`) requis pendant un déploiement. Par défaut, ce paramètre est à 100%, ce qui signifie dans notre exemple que nous devons toujours avoir au moins 12 tâches de lancées pendant un déploiement. 

Sur le déploiement lui-même à présent, voici comment il se déroulerait. Avec un `desired_count` à 12, un `max_healthy_percent` à 150% et un `min_healthy_percent` à 75%, nous avons un nombre de tâches saines qui doit rester entre 9 (12 * 0.75) et 18 (12 * 1.50) inclus :
1. Avant le déploiement, 12 tâches v1 sont en cours d'exécution
2. Au début du déploiement, on supprime (draine) 3 tâches v1 pour atteindre un minimum de 9 tâches en cours d'exécution
3. 9 nouvelles tâches v2 vont ensuite être lancées, pour atteindre un maximum de 18 tâches en cours d'exécution
4. ECS va attendre que ces 9 nouvelles tâches soient considérées comme saines
5. Une fois considérées comme saines on draine d'autres tâches v1 (9 en l'occurrence) jusqu'à atteindre le minimum, ou ne plus avoir de tâches v1 en cours d'exécution
6. On peut à présent lancer les 3 tâches v2 manquantes, pour revenir au nombre désiré de 12 tâches en cours d'exécution

Voici un tableau qui reprend ces étapes dans l'ordre, plus plus de clarté :

| Étape | Tâches v1 | Tâches v2 | Total |
| --- | :---: | :---: | :---: |
| START | 12 | 0 | 12 |
| DRAIN | 9 | 0 | 9 |
| DEPLOY | 9 | 9 | 18 |
| WAIT | 9 | 9 | 18 |
| DRAIN | 0 | 9 | 9 |
| DEPLOY | 0 | 12 | 12 |
| WAIT | 0 | 12 | 12 |
| END | 0 | 12 | 12 |

<aside><p>Devant vos conteneurs se trouve un Load Balancer (équilibreur de charge), qui répartit le traffic sur tous vos conteneurs. Une tâche n'est enregistrée auprès de lui qu'à partir du moment où elle est considérée comme saine. C'est ainsi qu'on peut vraiment parler de rolling update : selon vos réglages, il est probable que deux versions cohabitent pendant quelques minutes, le temps du déploiement.</p></aside>

## Le problème des déploiements infinis

Les déploiements en rolling update fonctionnent bien, très bien même. La possibilité de paramétrer les nombres minimum et maximum de tâches à exécuter permet de couvrir un grand nombre de cas d'usage. Mais tout ça, c'est dans le cas où tout fonctionne…

Il peut arriver malgré les tests qu'une image non saine soit déployée. Dans ce cas, vous allez entrer dans une boucle de déploiement infinie : les nouvelles tâches (v2) vont se couper toutes seules rapidement, et seront rapidement remplacées par d'autres, indéfiniment. Le déploiement n'atteindra jamais un stade avec suffisamment de tâches saines pour se terminer. Pire encore, à cause du [service throttle logic](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-throttle-logic.html), ECS détecte bien un nombre d'erreurs accru et va en réaction ralentir le déploiement des prochaines tâches ; un déploiement infini donc, et de plus en plus lent. Il faudra des heures avant que celui-ci ,e finisse par complètement échouer, sans aucune procédure de rollback.

[Il existe bien un moyen](https://aws.amazon.com/fr/blogs/compute/automating-rollback-of-failed-amazon-ecs-deployments/) de détecter les déploiements en erreur, à grands renforts de règles CloudWatch et de Lambdas surveillant les évènements `UpdateService`, calculant un pourcentage d'échec et déclenchant un rollback du déploiement. Tout ceci est très (trop) complexe, et AWS a fini par mettre en place une nouvelle fonctionnalité, directement intégrée au service ECS.

## Deployment Circuit Breaker

<aside><p>Cette fonctionnalité n'est disponible que pour les déploiements en rolling update.</p></aside>

[En Novembre 2020](https://aws.amazon.com/fr/blogs/containers/announcing-amazon-ecs-deployment-circuit-breaker/), AWS présente sa nouvelle fonctionnalité : le Deployment Circuit Breaker. L'objectif : proposer une alternative la plus simple possible pour détecter les déploiements en échec, et faire automatiquement un rollback.

Prenons pour exemple ce service Fargate, défini à l'aide de CDK. Je ne détaillerai pas ici le cluster et de la définition de tâche, qui ne sont pas pertinents, mais sachez tout de même que c'est la même procédure pour un `ecs.Ec2Service` :

```py
ecs.FargateService(stack, "MyService",
    cluster = cluster,
    task_definition = task_definition,
    desired_count = 12)
```

Activer un Circuit Breaker sur les déploiements de ce service ne sera pas plus compliqué qu'un argument supplémentaire ! Notez au passage que l'activation d'un rollback en cas d'échec est une option, désactivée par défaut :

```py
ecs.FargateService(stack, "MyService",
    cluster = cluster,
    task_definition = task_definition,
    desired_count = 12,
    circuit_breaker = ecs.DeploymentCircuitBreaker(rollback = True))
```

Mais comment tout ça fonctionne-t-il ?

Le Circuit Breaker va simplement surveiller le nombre de tâches qui ont échoué à se lancer lors d'un déploiement. Dès qu'on dépasse un certain seuil, le déploiement est considéré comme en échec, et le rollback se déclenche. Ce seuil est calculé avec la règle suivante :

```
S  = 0.5 * Nombre de tâches désirées
S >= 10
S <= 200
```

Pour notre exemple avec un `desired_count` de 12, nous aurions un seuil fixé au minimum de 10 échecs.

<aside><p>On ne peut pour le moment pas changer les seuils minimum et maximum fixés par AWS.</p></aside>

Une fois le Circuit Breaker en place, il vous est possible de suivre l'état du déploiement via la console AWS ou le CLI :

```sh
aws ecs describe-services \
  --cluster MyCluster-ClusterABC01234-XXXXXXXXXXXX \
  --services MyService \
  | jq -r '.services[0].deployments[] | select(.status == "PRIMARY")'
# {
#   "id": "ecs-svc/2222222222222222222",
#   "status": "PRIMARY",
#   "taskDefinition": "arn:aws:ecs:eu-west-3:000000000000:task-definition/MyServiceTaskDefXXXXXXXX:2",
#   "desiredCount": 12,
#   "pendingCount": 4,
#   "runningCount": 5,
#   "failedTasks": 4,
#   "createdAt": "2022-10-26T19:15:35.128000+02:00",
#   "updatedAt": "2022-10-26T19:15:35.128000+02:00",
#   "launchType": "FARGATE",
#   "platformVersion": "1.4.0",
#   "platformFamily": "Linux",
#   "rolloutState": "IN_PROGRESS",
#   "rolloutStateReason": "ECS deployment ecs-svc/2222222222222222222 in progress."
# }
```

Dans cet exemple on peut voir que 4 tâches ont déjà échoué, et ont été remplacées par 4 nouvelles tâches encore en cours de déploiement comme l'indique la valeur `pendingCount`. 

Si le déploiement réussi, l'attribut `rolloutState` passera à `COMPLETED`. Si en revanche la valeur de `failedTasks` dépasse le seuil (fixé à 10), vous pourrez voir le rollback se déclencher. Comme ce rollback est dans les faits un nouveau déploiement, vous verrez un attribut `rolloutState` toujours à `IN_PROGRESS`, et un `rolloutStateReason` vous indiquant qu'il s'agit d'un rollback. Vous pourrez d'ailleurs constater que l'identifiant du déploiement, et la version de votre définition de tâche ont changés, pour revenir à leur valeur précédente :

```sh
aws ecs describe-services \
  --cluster MyCluster-ClusterABC01234-XXXXXXXXXXXX \
  --services MyService \
  | jq -r '.services[0].deployments[] | select(.status == "PRIMARY")'
# {
#   "id": "ecs-svc/1111111111111111111",
#   "status": "PRIMARY",
#   "taskDefinition": "arn:aws:ecs:eu-west-3:000000000000:task-definition/MyServiceTaskDefXXXXXXXX:1",
#   "desiredCount": 12,
#   "pendingCount": 9,
#   "runningCount": 0,
#   "failedTasks": 0,
#   "createdAt": "2022-10-26T19:19:12.056000+02:00",
#   "updatedAt": "2022-10-26T19:19:12.056000+02:00",
#   "launchType": "FARGATE",
#   "platformVersion": "1.4.0",
#   "platformFamily": "Linux",
#   "rolloutState": "IN_PROGRESS",
#   "rolloutStateReason": "ECS deployment circuit breaker: rolling back to deploymentId ecs-svc/1111111111111111111."
# }
```

Une fois le rollback terminé, l'attribut `rolloutState` changera pour la valeur `FAILED`, et votre pipeline (si le déploiement est intégré dans une CodePipeline) échouera.


## Liens

[Référence AWS - Les types de déploiements ECS](https://docs.amazonaws.cn/en_us/AmazonECS/latest/userguide/deployment-type-ecs.html)    
[Référence CDK - DeploymentCircuitBreaker](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs.DeploymentCircuitBreaker.html)    

