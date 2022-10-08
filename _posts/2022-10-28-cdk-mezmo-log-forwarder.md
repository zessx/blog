---
layout: post
title:  "Transmettre vos logs CloudWatch à Mezmo avec CDK"
date:   2022-10-28
tags:
- aws
- cdk
- devops
- python
description: >
  Tutoriel pour mettre en place un log forwarder de CloudWatch à Mezmo via CDK.
---

## Introduction

Si vous utilisez des services AWS, il y a de (très) grandes chances pour que vous ayez activé la collecte des logs dans CloudWatch pour ces services. CloudWatch est très utile pour centraliser et surtout archiver à moyen terme les logs de vos services, mais il permet aussi un peu de monitoring et la mise en place d'alertes via Logs Insights (un excellent outil que je vous encourage à découvrir, je ferai probablement un article dessus plus tard).

En revanche, CloudWatch montre assez rapidement ses limites sur ses outils de monitoring, mais aussi et surtout sur les interfaces d'accès aux logs. Il est assez laborieux de faire des recherches rapides, et nous ne bénéficions pas de vue globale en temps réel. C'est pour cela que bon nombre d'équipes choisissent d'utiliser une solution externe pour ingérer ces logs : Datadog, New Relic, Mezmo (anciennement LogDNA), Logz.io…

Pour cet article nous allons nous pencher sur Mezmo / LogDNA, et voir comment lui transmettre nos logs CloudWatch. Si vous utilisez une autre solution, vous pourrez rapidement constater que la procédure est la même (en tout cas, au moins pour les deux gros mastodontes que sont Datadog et New Relic).

## Architecture requise

Plusieurs solutions existent pour transmettre vos logs à un service tiers.

Il est tout d'abord possible de le faire depuis votre application, via un agent qui dépendra du langage/framework utilisé. L'avantage de cette solution est surtout qu'elle peut être mise en place directement par l'équipe de développeurs. Votre application dépendra en revanche du service choisi, et il n'est pas exclu de devoir résoudre certains problèmes de performances et/ou de parallélisation (dans le cas d'une application conteneurisée).

Il est aussi possible de le faire depuis AWS, en surveillant les logs arrivant dans CloudWatch (via un Lambda) et en les transmettant à un service tiers. Je privilégie personnellement cette solution car elle ne surcharge pas l'application, et qu'elle me permet de changer de log manager facilement sans avoir à redéployer toutes les applications. Voici l'architecture de base que nous allons mettre en place :

{:.center}
![Architecture AWS pour un log forwarder]({{ site.url }}/images/cdk-mezmo-log-forwarder/aws-archi.png)

Je n'affiche ici que les éléments principaux, sachant que sont déjà en place :
- Votre application (ECS, EKS ou autre)
- Les groupes de logs CloudWatch
- Mezmo

Nous n'avons donc que le Lambda à créer. Vous noterez qu'aucun service ne dépend de ce Lambda, ce qui en fait un élément très simple à remplacer ou à supprimer au besoin.

## Mise en place avec CDK

### Lambda

Commençons par le plus important, la création du Lambda. Si vous n'êtes pas familier des Lambdas AWS, il s'agit d'un service serverless permettant d'exécuter du code stocké dans le cloud en réponse à un ou plusieurs événements.

Comme c'est généralement le cas, Mezmo fourni directement le code de ce Lambda, vous pouvez récupérer une archive de la version la plus récente sur le dépôt GitHub [logdna/logdna-cloudwatch](https://github.com/logdna/logdna-cloudwatch/releases) (le changement d'identité étant encore récent à l'heure ou j'écris cet article, la plupart des ressources sont encore sous l'appellation LogDNA, et non Mezmo), et la déposer dans votre projet CDK. Dans cet exemple, je renomme le fichier `assets/lambdas/mezmo-log-forwarder-2.2.1.zip` afin de savoir rapidement quelle version j'utilise.

On peut maintenant définir un Lambda avec les paramètres recommandés dans le README :

```py
from aws_cdk import (
    Duration,
    aws_lambda as lambdas,
)

# Création du Lambda
lambda_function = lambdas.Function(stack, "MezmoLogForwarder",
    function_name = "MezmoLogForwarder",
    description = "Forward logs to Mezmo",
    # Configuration du runtime
    runtime = lambdas.Runtime.NODEJS_14_X,
    timeout = Duration.seconds(10),
    memory_size = 128,
    retry_attempts = 0,
    # Code à déployer, et fonction à appeler
    code = lambdas.Code.from_asset("assets/lambdas/mezmo-log-forwarder-2.2.1.zip"),
    handler = "index.handler",
    # Variables d'environnements requises par Mezmo
    environment = {
        "LOGDNA_KEY": ""})
```

J'ai volontairement laissé la variable d'environnement `LOGDNA_KEY` vide, car je n'ai pas l'intention de mettre ma clé en dur dans le code. Pour la stocker et la récupérer de manière plus propre, nous allons utiliser un autre service.

### SecretsManager

Le service SecretsManager vous permet tout simplement de stocker des clés, tokens et autres variables sensibles en ligne. Ces variables ne sont pas stockées dans les templates CloudFormation, et sont généralement exclues des logs (attention à ne pas prendre ceci pour argent comptant, c'est un peu plus compliqué mais je n'entrerais pas plus dans les détails pour cet article). Nous allons donc créer un nouveau Secret pour y stocker la valeur de notre variable `LOGDNA_KEY`.

Cas particulier ici, nous allons passer non pas par CDK, mais par le CLI AWS (je vous explique pourquoi un peu plus tard):

```sh
export LOGDNA_KEY=1234567890abcdef1234567890abcdef
aws secretsmanager create-secret \
    --name MezmoIngestionKey \
    --description "Mezmo ingestion key." \
    --secret-string "{\"LOGDNA_KEY\":\"$LOGDNA_KEY\"}"
# {
#   "ARN": "arn:aws:secretsmanager:eu-west-3:123456789000:secret:MezmoIngestionKey-a1b2c3",
#   "Name": "MezmoIngestionKey",
#   "VersionId": "…"
# }
```

Maintenant que le Secret est créé, nous allons pouvoir le récupérer dans notre stack grâce à son ARN, et l'utiliser pour définir la valeur de `LOGDNA_KEY` :

```py
from aws_cdk import (
    Duration,
    aws_lambda as lambdas,
    aws_secretsmanager as sm,
)

# Récupération du secret à partir de son ARN
secrets = sm.Secret.from_secret_complete_arn(self, "MezmoIngestionKey",
    secret_complete_arn = "arn:aws:secretsmanager:eu-west-3:123456789000:secret:MezmoIngestionKey-a1b2c3")

lambda_function = lambdas.Function(stack, "MezmoLogForwarder",
    function_name = "MezmoLogForwarder",
    description = "Forward logs to Mezmo",
    runtime = lambdas.Runtime.NODEJS_14_X,
    timeout = Duration.seconds(10),
    memory_size = 128,
    retry_attempts = 0,
    code = lambdas.Code.from_asset("assets/lambdas/mezmo-log-forwarder-2.2.1.zip"),
    handler = "index.handler",
    # On utilise le Secret pour définir la variable d'environnement
    environment = {
        "LOGDNA_KEY": secrets.secret_value_from_json("LOGDNA_KEY").to_string()})
```

**Petit aparté sur les raisons qui me pousse à utiliser AWS CLI ici.**

CDK nous permet bien de créer un nouveau Secret, mais l'appel à `secret_value_from_json()` aurait échoué lors du deploy car la clé n'aurait à ce moment pas encore existé. Il existe d'autres façons de gérer ce problème, mais la plus simple reste encore de définir vos Secrets à la main et en dehors de votre stack.

Nous voici à présent avec un Lambda tout neuf et prêt à transmettre de logs. Ne reste plus qu'à le déclencher.

### CloudWatch

Nous voulons donc que ce Lambda soit déclenché dès qu'il y a de nouveaux logs dans le groupe de log de notre application. Il va nous falloir récupérer le nom ou l'ARN de ce LogGroup (via la console AWS ou le CLI), puis créer un SubscriptionFilter sur ce groupe de log. Je vais ici utiliser le nom d'un LogGroup pour mon exemple (`/aws/ecs/MyApplicationLogGroup`), mais ils est tout à fait possible d'utilise l'ARN via la fonction `logs.LogGroup.from_log_group_arn()`, ou carrément un objet de type `logs.ILogGroup` déjà présent dans votre stack :

```py
from aws_cdk import (
    Duration,
    aws_iam as iam,
    aws_lambda as lambdas,
    aws_logs as logs,
    aws_logs_destinations as destinations,
    aws_secretsmanager as sm,
)

secrets = sm.Secret.from_secret_complete_arn(self, "MezmoIngestionKey",
    secret_complete_arn = "arn:aws:secretsmanager:eu-west-3:123456789000:secret:MezmoIngestionKey-a1b2c3")

lambda_function = lambdas.Function(stack, "MezmoLogForwarder",
    function_name = "MezmoLogForwarder",
    description = "Forward logs to Mezmo",
    runtime = lambdas.Runtime.NODEJS_14_X,
    timeout = Duration.seconds(10),
    memory_size = 128,
    retry_attempts = 0,
    code = lambdas.Code.from_asset("assets/lambdas/mezmo-log-forwarder-2.2.1.zip"),
    handler = "index.handler",
    environment = {
        "LOGDNA_KEY": secrets.secret_value_from_json("LOGDNA_KEY").to_string()})

# On autorise le Lambda a accéder en lecture seule aux logs
lambda_function.add_to_role_policy(iam.PolicyStatement(
    effect = iam.Effect.ALLOW,
    resources = [
        "*"], # Vous pouvez restreindre les ressources au besoin
    actions = [
        "logs:Describe*",
        "logs:Get*",
        "logs:TestMetricFilter"]))

# On créer un filtre de souscription, qui va déclencher le Lambda quand de nouveaux logs arrivent
logs.SubscriptionFilter(stack, "SubscriptionFilter",
    log_group = logs.LogGroup.from_log_group_name(stack, "ApplicationLogGroup",
        log_group_name = "/aws/ecs/MyApplicationLogGroup"),
    destination = destinations.LambdaDestination(lambda_function),
    # On ne veut aucun filtrage sur les logs
    filter_pattern = logs.FilterPattern.all_events())
```

Et voilà, vous n'avez plus qu'à deployer votre stack pour que tout nouveau log dans le groupe `/aws/ecs/MyApplicationLogGroup` déclenche le Lambda, et soit automatiquement transmis à Mezmo.

Vous pouvez utiliser le même Lambda pour surveiller plusieurs groupes de log, mais il vous faudra pour cela créer un `SubscriptionFilter` par LogGroup.

## Alternatives à CDK

Cet article se focalise sur la mise en place d'un log forwarder avec CDK, mais tous les services de log management proposent des AWS Serverless Applications. Ces applications sont des stacks CloudFormation prêt-à-l'emploi avec une installation "en 1 clic". Il vous suffit en général de vous munir de votre clé d'API, puis de trouver l'application correspondant à votre service sur le [AWS Serverless Repository](https://serverlessrepo.aws.amazon.com/applications). Cliquez ensuite sur le bouton "Déployer" et laissez-vous guider dans le processus d'installation.

## Liens

[Référence CDK - Lambda](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_lambda-readme.html)
[Référence CDK - SecretsManager](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_secretsmanager-readme.html)
[Référence CDK - Logs SubscriptionFilter](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_logs.SubscriptionFilter.html)
[Datadog > CloudWatch Forwarder documentation](https://github.com/DataDog/datadog-serverless-functions/tree/master/aws/logs_monitoring)
[New Relic > CloudWatch Forwarder documentation](https://github.com/newrelic/aws-log-ingestion)
[Mezmo > CloudWatch Forwarder documentation](https://github.com/logdna/logdna-cloudwatch)
