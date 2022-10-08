---
layout: post
title:  "Rejouer un update hook avec Drush"
date:   2018-04-12
tags:
- drupal
- php
description: >
  Il est parfois utilse de rejouer certains hook de mise à jour de module, afin d'éviter de périlleuses modifications de BDD manuelles.
---

## Drush eval

Pour rejouer le hook de mise à jour, vous n'aurez besoin que de 2 informations :
- le nom du module
- le numéro du hook de mise à jour

Dans votre module `foo`, vous aurez par exemple ce hook de mise à jour dans le fichier `foo/foo.install` :

```php
function foo_update_8101() {
  /* ... */
}
```

Lors de la première mise à jour, ce hook aura probablement été exécuté via la commande `drush updatedb`. Mais il n'est plus possible d'utiliser cette commande car le hook a été tagué comme ayant été exécuté.

Il va falloir utiliser la commande `drush php-eval` (ou son alias `drush eval`) pour le lancer à la main, en chargeant au préalable le module en question :

```bash
drush eval "module_load_install('foo'); foo_update_8101();"
```

## Liens :

[La commande Drush php-eval](https://drushcommands.com/drush-8x/core/php-eval/)
[Le hook update dans Drupal](https://api.drupal.org/api/drupal/core%21lib%21Drupal%21Core%21Extension%21module.api.php/function/hook_update_N/8.5.x)
