---
layout: post
title:  "Still another developer blog…"
date:   2023-04-08
tags:
- divers
description: >
  Et ouais, toujours là.
---

## Joyeux anniversaire !

Aujourd'hui, ce blog a 10 ans. 🎉

Dix années, c'est une durée que je trouve difficile à se représenter. C'est à la fois assez court, le temps passe bien plus vite qu'on ne l'imagine et je garde encore un nombre extraordinaire de souvenirs très vifs d'il y a 10 ans. Mais c'est aussi tellement long… Tant de choses se sont passées dans ma vie personnelle et professionnelle, tant de choses que je n'aurais jamais envisagées ou même imaginées !

## Rétrospective

Malgré des études dans le génie logiciel et la conception informatique, j'ai sciemment décidé de lancer ma carrière en allant travailler dans des agences web. Je n'avais alors qu'une vision naïve et biaisée du monde de l'informatique, ne trouvant aucun entre-deux entre de grosses SSII (anciennes ESN) faisant du développement logiciel lourd avec leurs difficultés de l'époque à mettre en place des méthodes de travail agiles, et de petites agences web déjà flexibles avec leurs promesses de projets et de technologies variées.

Si l'intégration et le frontend ont très vite été [source](https://blog.smarchal.com/timer-full-css) de [multiples](https://blog.smarchal.com/pixel-art-css-box-shadow) [challenges](https://blog.smarchal.com/et-pour-quelques-octets-de-moins) pour moi, c'est au final vers l'[administration](https://blog.smarchal.com/https-avec-letsencrypt) [système](https://blog.smarchal.com/load-average), [puis](https://blog.smarchal.com/ecs-deployment-circuit-breaker) [vers](https://blog.smarchal.com/accelerer-deploy-ecs) le [DevOps](https://blog.smarchal.com/optimisation-images-docker) que j'ai fini par trouver mon bonheur.

Cette tendance se reflète d'ailleurs dans les sujets traités dans mes articles de blog à travers les années :

<script type="text/javascript" src="https://www.google.com/jsapi"></script>

<script type="text/javascript">
  google.charts.load('current', { 'packages': ['bar'] });
  google.charts.setOnLoadCallback(drawChartDomain);

  function drawChartDomain() {
    var data = google.visualization.arrayToDataTable([
      ['Année', 'AdminSys / DevOps', 'Backend', 'Frontend', 'Autres'],
      ["2013", 2 / 65, 13 / 65, 25 / 65, 25 / 65],
      ["2014", 14 / 56, 16 / 56, 13 / 56, 13 / 56],
      ["2015", 4 / 43, 12 / 43, 19 / 43, 8 / 43],
      ["2016", 1 / 7, 4 / 7, 1 / 7, 1 / 7],
      ["2017", 4 / 12, 3 / 12, 0 / 12, 5 / 12],
      ["2018", 0 / 11, 5 / 11, 0 / 11, 6 / 11],
      ["2019", 2 / 10, 6 / 10, 0 / 10, 2 / 10],
      ["2020", 4 / 7, 0 / 7, 3 / 7, 0 / 7],
      ["2021", 1 / 2, 0 / 2, 1 / 2, 0 / 2],
      ["2022", 16 / 25, 6 / 25, 0 / 25, 3 / 25],
      ["2023", 4 / 5, 1 / 5, 0 / 5, 0 / 5]
    ]);

    var options = {
      chart: {
        title: 'Répartition des articles par domaine',
        subtitle: 'Période de Avril 2013 à Avril 2023',
      },
      width: 800,
      height: 600,
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-color').trim(),
      chartArea: {
        backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-color').trim(),
      },
      isStacked: true,
      vAxis: {
        format: 'percent'
      },
      hAxis: {
        title: ''
      }
    };
    console.log(options)

    var chart = new google.charts.Bar(document.getElementById('chart_domain'));
    chart.draw(data, google.charts.Bar.convertOptions(options));
  }
</script>
<div id="chart_domain"></div>

Le rythme des article a par contre nettement diminué au fil des ans. D'une trentaine d'articles par an jusqu'en 2015, je suis passé à moins d'une dizaine, comme en témoigne le graphique suivant. 

<script type="text/javascript">
  google.charts.setOnLoadCallback(drawChartAmount);

  function drawChartAmount() {
    var data = google.visualization.arrayToDataTable([
      ['Année', 'Articles'],
      ["2013", 41],
      ["2014", 35],
      ["2015", 34],
      ["2016", 4],
      ["2017", 7],
      ["2018", 8],
      ["2019", 6],
      ["2020", 3],
      ["2021", 2],
      ["2022", 10],
      ["2023", 3]
    ]);

    var options = {
      chart: {
        title: 'Nombre d\'articles',
        subtitle: 'Période de Avril 2013 à Avril 2023',
      },
      width: 800,
      height: 600,
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-color').trim(),
      chartArea: {
        backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-color').trim(),
      },
      legend: { 
        position: "none" 
      },
      isStacked: true,
      hAxis: {
        title: ''
      }
    };

    var chart = new google.charts.Bar(document.getElementById('chart_amount'));
    chart.draw(data, google.charts.Bar.convertOptions(options));
  }
</script>
<div id="chart_amount"></div>

Moins d'articles certes, mais des articles de meilleure qualité ! Il suffit de regarder les articles parus ces [deux](https://blog.smarchal.com/bash-substitutions-variables) [dernières](https://blog.smarchal.com/load-average) [années](https://blog.smarchal.com/cdk-mezmo-log-forwarder) pour le constater, je recherche aujourd'hui plus à expliquer qu'à simplement partager. Les sujets traités gagnent aussi en complexité, ce qui me demande forcément un peu plus de travail de rédaction (particulièrement sur les tutorials, qui doivent être facilement reproductibles chez tout le monde). 

Aujourd'hui, il y a en moyenne environ 1600 visiteurs uniques légitimes par jour sur le blog (en semaine uniquement). C'est un chiffre donc je suis assez heureux et fier, qui me motive à continuer à rédiger de nouveaux articles.

<aside><p>Cela va faire bientôt 4 ans que tous les traceurs d'analytics ont été supprimé du blog, afin de vous garantir plus de confidentialité (d'où l'absence d'un joli bandeau cookies). À la place, j'utilise <a href="https://goaccess.io/" href="_goaccess">GoAccess</a> pour parser localement mes fichiers de logs Nginx et récupérer ces chiffres anonymes.</p></aside>

À propos de popularité justement, voici la liste des 10 articles du blog les plus lus :
- [L’opérateur ternaire en PHP](https://blog.smarchal.com/operateur-ternaire-php) (2013)
- [Le modulo en JS](https://blog.smarchal.com/modulo-en-js) (2014)
- [Changer le format d’une date en PHP"](https://blog.smarchal.com/changer-format-date-php) (2013)
- [Activer HTTP/2 sur Nginx](https://blog.smarchal.com/http2-nginx) (2020)
- [Sass et media queries](https://blog.smarchal.com/sass-et-media-queries) (2014)
- [Regex et Unicode](https://blog.smarchal.com/regex-et-unicode) (2015)
- [PHP : self versus static](https://blog.smarchal.com/php-self-vs-static) (2019)
- [Créer un virtual host avec WampServer](https://blog.smarchal.com/creer-un-virtualhost-avec-wampserver) (2014)
- [jQuery data() vs attr()](https://blog.smarchal.com/jquery-data-vs-attr) (2015)
- [La mise en cache des ressources JS/CSS](https://blog.smarchal.com/mise-en-cache-js-css) (2014)

Une écrasante majorité d'anciens articles écrit entre 2013 et 2015, pour plusieurs raisons. Pour commencer ces sujet sont plus accessibles et concernent un plus grand nombre de développeur·ses ; ce sont aussi les articles qui ont eu le plus de temps pour être aujourd'hui bien référencés ; pour finir, certains d'entres eux ont été cités dans des échanges sur des sites et forums à très fort trafic, ce qui donne toujours un petit coup de pouce…

## Prospective

Maintenir ce blog à toujours été et reste encore un plaisir. Pour garantir cela à l'avenir, il me faut garder comme aujourd'hui une totale liberté sur le contenu et le rythme de publication. Pas de grand changement à venir donc, je vais toutefois essayer de publier au moins un article par mois (`/remind @me in 6 months`), à commencer par un gros dossier de 6 articles (!!) sur la gestion de machines EC2 avec AWS CloudFormation dont la rédaction est déjà bien avancé…

Sur le contenu, je vais continuer de chercher à développer plus en profondeur mes sujets. Les outils de DevOps et tout particulièrement certains services AWS et CDK seront évidemment à l'honneur, car je les utilise au quotidien tout en découvrant énormément de choses dessus. Il y a par exemple assez peu de contenu (hors documentation) sur CDK et à ma connaissance presque aucun article en français, je pense qu'il y a un manque à combler ici, à mon échelle.

Sur la forme, je rêverais de publier des articles du niveau de ceux de Bartosz Ciechanowski, dont j'admire vraiment le travail. Si vous ne le connaissez pas encore, foncez découvrir ses articles qui sont tous des pépites sur lesquelles perdre plusieurs heures, en particulier [GPS](https://ciechanow.ski/gps/), [Earth and Sun](https://ciechanow.ski/earth-and-sun/) et surtout, SURTOUT [Mechanical Watch](https://ciechanow.ski/mechanical-watch/) ! J'ai malheureusement bien trop de passions annexes et bien trop peu de temps pour pouvoir en consacrer autant à chacun de mes articles, je vais donc garder encore un certain temps le format actuel. 

Le style général du blog quant à lui n'a pas vraiment bougé depuis la v3 sortie en Juin 2015, et me plaît de façon assez surprenante encore aujourd'hui, je vais là aussi garder l'existant. Si je dois faire évoluer quelque chose, ce sera probablement l'affichage des blocs de code qui (je trouve) est un peu lourd quand le nombre de lignes augmente. 

Voici pour la suite, et rendez-vous dans 10 ans !
