---
layout: post
title:  "Drupal Form API : rendre un champ File obligatoire"
date:   2017-12-15
tags:
- drupal
- php
description: >
  Voici comment rendre des champs de type `file` obligatoires dans un formulaire, avec Drupal 8.
---

## La clé `#required`

En temps normal, on utilise la clé `#required` pour rendre un champ obligatoire :

```php
$form['title'] = array(
  '#type'     => 'textfield',
  '#title'    => t('Title'),
  '#required' => true
);
```

Il subsiste malheureusement un bug dans Drupal 8 (8.4.3 à l'heure où j'écris cet article), qui rend l'utilisation de cette clé sur un champ de type `file` impossible :

```php
$form['image'] = array(
  '#type'     => 'file',
  '#title'    => t('Picture'),
  '#required' => true
);
```

En utilisant le code ci-dessus, votre formulaire renverra systématiquement une erreur indiquant que le champ `image` n'a pas été rempli, que vous ayez ou non sélectionné une image.

## `FormBase::validateForm`

Puisque la validation ne peut pas être définie dans le tableau de rendu, nous allons utiliser l'autre méthode disponible : la fonction `validateForm`. Cette fonction est habituellement utilisée pour des validations plus poussées, elle permet d'avoir un traitement personnalisé, et de déclencher des erreurs sur le formulaire.

Nous allons parcourir tous les champs de type `file`, et verifier (pour ceux que l'on veut) si les valeurs sont nulles :

```php
public function validateForm(array &$form, FormStateInterface $form_state)
{
  $all_files = $this->getRequest()->files->get('files', []);
  if (empty($all_files['image'])) {
    $form_state->setErrorByName('image', t('The « image » file is required.'));
  }
}
```

## L'aspect visuel

Le fait de ne pas pouvoir définir notre champ comme requis amène un autre soucis : on ne bénéficie pas du repère visuel (l'étoile rouge) sur ce champ. Ce repère est (en temps normal) affiché grace à une classe `form-required` appliquée sur le label :

```html
<div class="form-item form-type-file form-item-files-image">
  <label for="edit-image form-required">Image</label>
  <input data-drupal-selector="edit-image" type="file" id="edit-image" name="files[image]" size="60" class="form-file">
</div>
```

Malheureusement, il n'est pas possible d'ajouter une classe sur le label à travers le tableau de rendu (en tout cas pas sans modifier les templates).

Qu'à cela ne tienne, nous allons en ajouter une sur le conteneur ! C'est tout à fait possible grace à la clé `#wrapper_attributes` :

```php
$form['image'] = array(
  '#type' => 'file',
  '#title' => t('Picture'),
  '#wrapper_attributes' => array(
    'class' => array('form-file-required')
  )
);
```

Ce composant sera rendu ainsi :

```html
<div class="form-item form-type-file form-item-files-image form-file-required">
  <label for="edit-image">Image</label>
  <input data-drupal-selector="edit-image" type="file" id="edit-image" name="files[image]" size="60" class="form-file">
</div>
```

Ce qui nous permet ensuite de créer une librairie dédiée (pour plus d'informations sur la manière de créer une librairie dans un module ou un thème, [voir ce lien](https://www.drupal.org/docs/8/theming-drupal-8/adding-stylesheets-css-and-javascript-js-to-a-drupal-8-theme)), qui reproduira la petite étoile rouge :

```css
/* MODULE/css/form-file-required.css */
.form-file-required label:after {
  content: '*';
  margin: 0 0.3em;
  color: #f0262d;
}
```

Ne reste plus qu'à lier cette librairie à notre formulaire, via le tableau de rendu, et le tour est joué :

```php
$form['#attached'] = array(
  'library' => array('MODULE/form-file-required')
);
```

## Liens

- [Form API](https://www.drupal.org/docs/8/api/form-api/introduction-to-form-api)
- [FormBase::validateForm](https://api.drupal.org/api/drupal/core%21lib%21Drupal%21Core%21Form%21FormBase.php/function/FormBase%3A%3AvalidateForm/8.4.x)
- [Les librairies CSS et JS dans Drupal 8](https://www.drupal.org/docs/8/theming-drupal-8/adding-stylesheets-css-and-javascript-js-to-a-drupal-8-theme)
