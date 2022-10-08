---
layout: post
title:  "Forcer macOS à approuver un certificat SSL auto-signé"
date:   2018-02-27
tags:
- software
description: >
  Voici la procédure complète pour approuver des certificats SSL, et ainsi éviter de nombreux messages d'alerte sur macOS.
---

## Etape 1 : récupérer le certificat

Il est possible que vous ayez déjà votre certificat sous forme de fichier `.pem`. Si c'est le cas, vous pouvez directement passer à l'étape 2.

Dans le cas contraire, il va falloir le récupérer avec la commande `openssl`, disponible par défaut sur macOS. Vous n'aurez besoin que de deux informations :
- le nom de domaine qui utilise le certificat
- le nom du fichier dans lequel stocker le certificat

Voici un exemple ci-dessous, permettant de stocker le certificat SSL utilisé sur ce blog dans un fichier, remplacez simplement les noms de domaine et de fichier par ceux que vous voulez :

    openssl s_client -showcerts -connect blog.smarchal.com:443 </dev/null 2>/dev/null|openssl x509 -outform PEM >~/cert_blog.pem

Le fichier `~/cert_blog.pem` contient désormais votre certificat SSL à approuver.

## Etape 2 : ajouter le certificat

Maintenant que vous avez récupéré le certificat, il va falloir l'ajouter à votre trousseau d'accès. Recherchez l'application `Trousseau d'accès` via Spotlight, ou accédez-y via `Applications > Utilitaires > Trousseau d'accès`.

Dans la colonne de gauche, sélectionnez le trousseau `Système` et la catégorie `Certificats` (attention à ne pas confondre avec `Mes certificats`).

{:.center}
![Le trousseau d'accès de macOS]({{ site.url }}/images/macos-certificats-selfsigned/certificats.png)

Cliquez ensuite sur le bouton `+` en bas de fenêtre, et sélectionnez votre fichier `.pem`. Il vous sera demandé de rentrer votre mot de passe administrateur.

## Etape 3 : approuver le certificat

Maintenant que le certificat est ajouté, il reste encore à l'approuver.

C'est l'étape la plus simple, il suffit de double cliquer sur votre certificat (dans la fenêtre du trousseau d'accès), puis de sélectionner `Toujours approuver` dans la section `Se fier`. Vous pouvez soit approuver le certificat de manière globale, soit affiner vos réglages pour par exemple n'approuver son utilisation que sur la signature de code. Lorsque vous fermerez cette fenêtre, il vous sera une dernière fois demandé d'entrer votre mot de passe administrateur.

## Liens

[Comment télécharger un certificat SSL distant ?](https://superuser.com/a/641396/151249)
