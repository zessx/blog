---
layout: post
title:  "HTTPS avec Let's Encrypt"
date:   2017-02-01
tags:
- apache
- server
description: >
  Comment activer le protocole HTTPS et générer des certificats SSL sur votre serveur ?
---

> Cet article suppose que vous avez accès à un serveur dédié ou un VPS, avec Apache

Suite à certains événements survenus l'année dernière, j'ai décidé de m'intéresser au protocole HTTPS, et d'essayer de le mettre en place sur mes différents noms de domaine. Étant assez novice dans ce domaine, il m'aura fallu un peu de temps avant de comprendre ce dont j'avais besoin.

## HTTPS Everywhere

Il y a quelques mois, [Google annonçait sur son blog](https://security.googleblog.com/2016/09/moving-towards-more-secure-web.html) vouloir encourager le passage d'un maximum de sites de HTTP à HTTPS. Ceci pour permettre une navigation plus sûre sur le web.

Mais concrètement, à quoi peut bien servir un certificat SSL/TLS ?
Quand vous créez un certificat, vous le faites toujours depuis votre serveur. Ce certificat va principalement contenir une clé publique et une clé privée :

- La clé privée est protégée, et sera utilisée pour identifier le serveur
- La clé publique est diffusée, et sera utilisée par les visiteurs pour chiffrer les informations qu'ils envoient à votre serveur

Un certificat SSL/TLS vous assure donc :

- **L'authenticité** : vous êtes sûr de dialoguer avec le bon serveur
- **La confidentialité** : vos échanges sont cryptés à l'aide des clés
- **L'intégrité** : il est impossible d'altérer les échanges

Ces points sont extrêmement importants dès lors que l'on parle de paiement en ligne, de messagerie ou de données personnelles (banques, assurances, réseaux sociaux...). L'intérêt est certes moindre dans le cas d'un blog ou de petits projets personnels, mais cela ne coûte aujourd'hui plus rien, et il est bon d'aller dans le sens d'une sécurisation globale du net.

## Let's Encrypt

Cette sécurisation globale n'aurait jamais été possible, ou en tout cas pas encore initiée, sans un acteur majeur : [Let's Encrypt](https://letsencrypt.org/).

Let's Encrypt est une autorité de certification, un tiers de confiance chargé de délivrer et vérifier des certificats SSL ou TLS. Un certificat ne sert effectivement à rien s'il n'y a personne pour l'authentifier.
Fondée fin 2015 par la **Fondation Mozilla**, l'**Université du Michigan** et l'**Electronic Frontier Foundation**, elle a déjà délivré plus de 10 millions de certificats gratuitement.

Car oui, ses certificats sont gratuits.

## Installer Certbot

Certbot est le nouveau nom du client Let's Encrypt. C'est l'outil principal que vous allez utiliser pour obtenir des certificats et activer HTTPS sur votre site.

Voici ce que vous devriez avoir avant de commencer :

- Un site hébergé sur votre serveur
- Un nom de domaine pointant sur ce serveur
- Un vhost (Apache) liant les deux

L'installation de certbot se fait simplement via git, pensez donc à l'installer si ce n'est pas déjà fait. Ici nous allons installer l'outil certbot dans le dossier `/opt/letsencrypt` :

    sudo apt-get update
    sudo ap-get install git
    sudo git clone https://github.com/certbot/certbot /opt/letsencrypt

Et c'est terminé !

## Générer un certificat

L'outil certbot est extrêmement bien fichu, à tel point que vous n'avez presque rien à faire !
Pour générer un certificat, il vous suffit de lancer la commande suivante :

    /opt/letsencrypt/letsencrypt-auto

Cette commande va commencer par installer tout ce qui est nécessaire, puis va rechercher tous les vhosts actifs de votre serveur Apache. Elle va ensuite vous demander pour quel(s) nom de domaine vous voulez générer le certificat :

    Which names would you like to activate HTTPS for?
    -------------------------------------------------------------------------------
    1: blog.smarchal.com
    2: work.smarchal.com
    -------------------------------------------------------------------------------
    Select the appropriate numbers separated by commas and/or spaces, or leave input
    blank to select all options shown (Enter 'c' to cancel):

Attention, je vous conseille ici de générer vos certificats un par un. Lors de mes différents essais, il s'est avéré que quand je choisissais plusieurs domaines d'un coup, le certificat était certes activé sur tous ces domaines, mais n'était délivré qu'au premier.

Après cette étape, certbot vous demande si vous désirez forcer le HTTPS, ou non :

    Please choose whether HTTPS access is required or optional.
    -------------------------------------------------------------------------------
    1: Easy - Allow both HTTP and HTTPS access to these sites
    2: Secure - Make all requests redirect to secure HTTPS access
    -------------------------------------------------------------------------------
    Select the appropriate number [1-2] then [enter] (press 'c' to cancel):

À vous de choisir, je préconise l'option 2. Si c'est aussi votre choix, certbot va automatiquement dupliquer votre vhost pour avoir une version SSL, et modifier l'original afin de forcer l'utilisation de HTTPS, en ajoutant ces lignes :

    RewriteEngine on
    RewriteCond %{SERVER_NAME} =blog.smarchal.com
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,QSA,R=permanent]

**Votre certificat est à présent en place !**

Si vous regardez le contenu du vhost nouvellement créé, vous trouverez le même contenu que dans l'ancien, avec ces 3 lignes en plus :

    SSLCertificateFile /etc/letsencrypt/live/blog.smarchal.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/blog.smarchal.com/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf

Ces lignes vous indiques où se situent votre certificat et la clé privée correspondante (ici dans `/opt/letsencrypt/live/blog.smarchal.com/`), ainsi que les options utilisées pour la configuration SSL. Vous pouvez si vous le voulez modifier ce fichier d'options (déconseillé), ou bien changer ces options directement dans votre vhost (conseillé).

## Vérifier votre site

L'activation d'HTTPS ne pose la plupart du temps aucun soucis, mais dans certains cas, il vous faudra faire quelques ajustements. Un site en HTTPS **ne doit pas** (pour des raisons évidentes de sécurité) faire appel à des ressources en HTTP. Pensez-donc à bien vérifier :

- Les urls des ressources externes (Google Fonts, jQuery...)
- Les urls des ressources internes (JS, CSS, images)
- Votre fichier .htaccess (qui n'est peut-être pas adapté au protocole HTTPS)

## Renouveler un certificat

Les certificats de Let's Encrypt sont valables 3 mois, il va donc falloir les renouveler régulièrement si vous ne voulez pas qu'une belle alerte de sécurité surgisse sur le navigateur de vos visiteurs !

Là aussi, certbot vous mâche le travail, vous n'aurez qu'à lancer la commande suivante :

    /opt/letsencrypt/letsencrypt-auto --apache --renew-by-default -d blog.smarchal.com

**Votre certificat est à présent renouvelé !**

Il est possible d'automatiser cette tâche, en l'ajoutant dans votre crontab. Plusieurs scripts sont trouvables sur le net, qui permettent de vérifier si votre certificat expire bientôt, de le renouveler si c'est le cas, mais aussi de vous avertir par mail si le renouvellement a échoué.
Personnellement, [j'utilise ce script](https://gist.github.com/erikaheidi/4d579acf553297da0fa1), que je lance toutes les semaines via un cron.

## Liens

- [Let's Encrypt](https://letsencrypt.org/)
- [Certbot sur GitHub](https://github.com/certbot/certbot)
- [Auto renewal script](https://gist.github.com/erikaheidi/4d579acf553297da0fa1)