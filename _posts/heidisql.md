# HeidiSQL
- zessx
- zessx
- 2013/10/22
- MySQL ; Software ; Development
- published

Présentation de HeidiSQL, un remplaçant à PHPMyAdmin.

## See ya, PhpMyAdmin !

Depuis quelques mois déjà j'ai quitté PhpMyAdmin. Certes, c'est un bon client MySQL qui fait ce qu'on lui demande de faire, et je l'ai d'ailleurs utilisé depuis mes débuts (notamment parce qu'il était fournis avec WampServer, anciennement WAMPP). J'ai fini malgré tout par le quitter parce que je lui trouvais quelques défauts assez gênants pour développer au quotidien :

* Des lenteurs inhérentes aux clients web et à l'utilisation du protocole HTTP
* Une sidebar qui n se rafraîchit pas (ou mal)
* Un mode d'édition un peu contraignant (amélioré avec la v3.5)
* Un système pour les requêtes au vol mal fichu
* Une pagination contraignante, lente
* Une gestion des clés et des index pas très intuitive
* Les triggers, fonctions et procédures stockées sont difficilement accessibles
* ...

Bref tout un tas de petits points plus ou moins importants, mais qui finissent par peser quand on les cumule sur le long terme.
J'ai cherché une alternative à PhpMyAdmin, et je suis rapidement tombé sur HeidiSQL, qui m'a convaincu rapidement. Voici ci-dessous les points que j'ai pu retenir (qui ne sont pas forcément spécifiques à HeidiSQL).

*Note : j'utilise la v7, je n'ai pas encore testé la v8, sortie en mai 2013*

<center>![Interface de HeidiSQL](posts/images/heidisql/table_editor.png)</center>

## Points positifs

* On ne passe pas par le navigateur, on a donc une vitesse incomparable
* On peut gérer plusieurs serveurs de BDD et switcher facilement entre eux
* L'édition se fait très facilement : double-clic, Entrée pour valider le tout
* Un système d'onglet hiérarchisés permet l'accès rapide au serveur, à la BDD, à la table, au données, et aux requêtes au vol
* On peut créer plusieurs requêtes simultanément sans être obligé d'en perdre une
* Pas de pagination sur les données, tout est affiché
* La gestion des clés (UNIQUE, PRIMARY...) est simplissime
* Les triggers, fonctions et procédures stockées sont accessibles au même endroit que les tables (donc bien visibles)
* On peut créer ses snippets et y accéder rapidement
* Accès direct aux logs et à l'historique des requêtes
* L'export/import d'une table, d'une BDD est hyper-rapide


## Points négatifs

* Des progrès à faire sur la sidebar (un F5 réduit toutes les lignes développées)
* Les snippets n'acceptent pas de paramètres, ils sont du coup assez limités
* Le système de filtre sur les colonnes est complet, mais assez mal fichu
* Limité à MySQL et MSSQL


Voilà pour le retour !
Globalement, je suis très satisfait de ce logiciel, je vous invite vraiment à le tester si ce n'est pas déjà fait. Laissez-vous quelque jour, le temps de vous adapter à son fonctionnement (qui reste très intuitif), et vous verrez que le gain de temps est énorme !

## Liens :
[HeidiSQL - Site officiel](http://www.heidisql.com/)