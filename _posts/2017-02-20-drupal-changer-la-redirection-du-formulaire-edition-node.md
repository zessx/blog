---
layout: post
title:  "Drupal 8 : Changer la redirection des formulaires d'edition des nodes"
date:   2017-02-20
tags:
- drupal
- php
description: >
  Comment être redirigé ailleur sur la page de détail d'un node après l'avoir créé/modifié ?
---

<aside><p>Cet article a été rédigé pour la version 8 de Drupal.</p></aside>

Sur certains projets, je trouve assez frustrant de me voir redirigé sur la page de détail du node que je viens de créer.
Cette redirection m'oblige à revenir dans le backoffice moi-même, ce qui devient rapidement insupportable à force.

## Identifier le formulaire

La première étape dans la mise en place de cette redirection sera d'identifier le ou les formulaires concernés.
Tous les formulaire ont un identifiant appelé `machine name`. C'est cet identifiant dont nous allons avoir besoin.

Si vous ne désirez changer la redirection que pour un seul type de node, vous pouvez directement utiliser le hook `hook_form_FORM_ID_alter`. Prenons par exemple un type de contenu "Actualité" dont l'identifiant serait `news`. Le formulaire correspondant aurait pour identifiant `node_news_form`, ce qui nous donne ce code :

```php
use Drupal\Core\Form\FormStateInterface;

function MODULE_form_node_news_form_alter(&$form, FormStateInterface $form_state)
{
  // …
}
```

Si en revanche vous voulez ciblez tous les formulaires de création et de modification de contenu, il va falloir passer par un hook plus général : `hook_form_node_form_alter`. Cette fonction sera appelée quel que soit le type de contenu :

```php
use Drupal\Core\Form\FormStateInterface;

function MODULE_form_node_form_alter(&$form, FormStateInterface $form_state, $form_id)
{
  // …
}
```

## Modifier le formulaire

Drupal 8 ne propose pas de hook du type `hook_form_submit`. En revanche, il est possible de modifier un formulaire pour y ajouter une fonction de callback sur une action.
L'action la plus évidente est bien sûr `submit`, on pourrait donc se contenter du code suivant :

```php
$form['actions']['submit']['#submit'][] = '_MODULE_node_form_submit';
```

On indique ici que l'on veut appeler la fonction `_MODULE_node_form_submit` quand l'action `submit` est déclenchée. Le problème, c'est qu'il n'y a pas que cette action a traiter. On va donc parcourir la liste des actions disponibles, et ajouter notre callback sur toutes celles qui seront de type `submit`. **Attention à ne pas confondre l'identifiant `submit` (qui ne concernait qu'une seule action) et le type d'action `submit`, que plusieurs actions peuvent avoir.**. Vous noterez l'exception faite sur l'action `preview`, qui est du type `submit` mais pour laquelle on ne veut pas de redirection (sans quoi on ne pourrait jamais accéder à la page de prévisualisation) :

```php
foreach (array_keys($form['actions']) as $action) {
  if (isset($form['actions'][$action]['#type']) && $form['actions'][$action]['#type'] === 'submit' && $action != 'preview') {
    $form['actions'][$action]['#submit'][] = '_MODULE_node_form_submit';
  }
}
```

## Faire la redirection

La redirection se fera donc dans notre fonction de callback (notre "submit handler"). Ici, rien de compliqué car l'interface `FormStateInterface` propose une fonction `setRedirect`, qu'on utilisera pour rediriger vers la route `system.admin.content` (qui correspond à la page "Contenu" du backoffice) :

```php
$form_state->setRedirect('system.admin_content');
```

## Le code complet

Voici donc l’agrégation de tous les bouts de codes que nous avons vu dans cet article :

```php
use Drupal\Core\Form\FormStateInterface;

function MODULE_form_node_form_alter(&$form, FormStateInterface $form_state, $form_id)
{
  foreach (array_keys($form['actions']) as $action) {
    if (isset($form['actions'][$action]['#type']) && $form['actions'][$action]['#type'] === 'submit' && $action != 'preview') {
      $form['actions'][$action]['#submit'][] = '_MODULE_node_form_submit';
    }
  }
}

function _MODULE_node_form_submit(&$form, FormStateInterface $form_state)
{
  $form_state->setRedirect('system.admin_content');
}
```

## Liens

[Drupal API - hook_form_alter](https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Form!form.api.php/function/hook_form_alter/8.2.x)
[Drupal API - hook_form_BASE_FORM_ID_alter](https://api.drupal.org/api/drupal/core%21lib%21Drupal%21Core%21Form%21form.api.php/function/hook_form_BASE_FORM_ID_alter/8.2.x)
[Drupal API - FormStateInterface](https://api.drupal.org/api/drupal/core!lib!Drupal!Core!Form!FormStateInterface.php/interface/FormStateInterface/8.2.x)
[Drupal Community - Submit handlers](https://www.drupal.org/node/2637958)
