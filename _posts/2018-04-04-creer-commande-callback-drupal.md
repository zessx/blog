---
layout: post
title:  "Créer une commande de callback AJAX avec Drupal 8"
date:   2018-04-04
tags:
- drupal
- php
description: >
  Les commandes de callback AJAX fournies par Drupal 8 ne sont pas toujours suffisantes. Voici comment en créer une entièrement, qui répondra à un besoin précis.
---

*Cet article ne concerne que la version 8 de Drupal.*

## Les fonctions de callback AJAX

Drupal 8 fournit une API pour faire des appels AJAX sans nécessairement écrire de JavaScript. Cette API est héritée du "AJAX Framework" introduit avec Drupal 7, et permet de simplifier et d'accélérer le développement en permettant de déplacer les appels et traitements AJAX du JavaScript au Controller PHP.

Plutôt que de renvoyer un tableau de rendu, certaines fonctions de Controller vont renvoyer un objet `Drupal\Core\Ajax\AjaxResponse`. Cet objet sera renvoyé sous forme de JSON, et sera traité par le fichier chargé de gérer les appels et traitement AJAX dans Drupal 8 (`core/misc/ajax.js`). Dans le Controller, on va attacher des "commandes" à cette réponse ; ces commandes décrivent les traitements qu'il va falloir exécuter par la suite, et correspondent toutes à une fonction de jQuery.

Certaines de ces commandes sont assez souvent utilisées :
- `RedirectCommand`
- `HtmlCommand`
- `RemoveCommand`
- `AppendCommand`
- `InvokeCommand`
- ...

Pour plus de détails sur la manière de les utiliser, je vous renvoie à la [documentation de l'API](https://api.drupal.org/api/drupal/core%21core.api.php/group/ajax). Vous pourrez aussi trouver [la liste exhaustive des commandes](https://github.com/drupal/drupal/tree/8.5.x/core/lib/Drupal/Core/Ajax) sur GitHub.

## Pourquoi créer une nouvelle commande ?

Dans les commandes existantes on peut trouver `InvokeCommand`, qui permet d'appeler n'importe quelle fonction jQuery. Mais ce n'est pas toujours suffisant ! Le chaînage de fonction par exemple n'est pas possible.

Je vais prendre l'exemple concret d'un projet sur lequel je suis intervenu, et dans lequel certains boutons déclenchaient des appels AJAX, puis devaient avoir une classe particulière pendant un certains nombre de secondes. Voici le callback que je veux alors exécuter (je rappelle que jQuery est chargé par défaut, et nécessaire pour utiliser AJAX avec Drupal 8) :

    setTimeout(function() {
      $('button.ajax').removeClass('ajax-success ajax-error');
    }, 3000);

Nous allons voir ensemble comment créer une commande simple qui correspond à ce traitement.

## Fonctionnement général

Avant de les voir en détails, voici une liste des étapes qu'il faudra suivre pour créer une commande :

- Créer un module (étape non détaillée)
- Définir la commande en PHP, qui sera chargée de définir les données à envoyer au traitement JS
- Mettre en place le traitement, dans un fichier JS
- Déclarer une librairie dans le module, qui chargera le fichier JS
- Charger la librairie dans un tableau de rendu
- Utiliser la commande dans un retour AJAX

## Définition de la commande en PHP

Pour cette première étape, il faut créer une classe qui hérite de `Drupal\Core\Ajax\CommandInterface`. Comme d'habitude, on reprend le namespace de la classe parente (`Drupal\Core\Ajax`), en remplaçant `Core` par le nom de notre module : `Drupal\ajaxextended\Ajax`.

Voici le contenu de base d'une commande :

    <?php

    // web/modules/custom/ajaxextended/src/Ajax/RemoveFeedbackClassesCommand.php
    namespace Drupal\ajaxextended\Ajax;

    use Drupal\Core\Ajax\CommandInterface;

    class RemoveFeedbackClassesCommand implements CommandInterface
    {
        public function __construct()
        {}

        /**
         * Implements Drupal\Core\Ajax\CommandInterface:render().
         */
        public function render()
        {
            return [
                'command' => 'removeFeedbackClasses'
            ];
        }
    }

Il faut ensuite y ajouter les paramètres dont nous auront besoin. Dans notre cas, il suffira d'un sélecteur pour identifier l'élément à modifier lors du traitement. On ajoute donc une propriété à notre classe :

    protected $selector;

On modifie le constructeur conséquemment :

    public function __construct($selector)
    {
        $this->selector = $selector;
    }

Et on modifie la fonction de rendu pour transmettre le sélecteur dans le retour JSON :

    public function render()
    {
        return [
            'command' => 'removeFeedbackClasses',
            'selector' => $this->selector
        ];
    }

Voilà, la partie serveur chargée de renvoyer un objet JSON décrivant les traitements à effectuer est prête. Passons donc à la suite.

## Mise en place du traitement

Cette seconde étape se passe côté client. Commençons donc par ajouter notre nouvelle commande dans l'objet `Drupal.Ajax.AjaxCommands.prototype`, en créant un fichier JavaScript dans le module :

    // web/modules/custom/ajaxextended/js/commands.js
    (function($, Drupal) {

      Drupal.AjaxCommands.prototype.cleanFeedbacks = function(ajax, response, status) {
        setTimeout(function() {
          $(response.selector).removeClass('ajax-success ajax-error');
        }, 3000);
      };

    })(jQuery, Drupal);

On retrouve ici le traitement dont j'avais parlé au début de cet article, c'est le coeur de la commande. Notons au passage les trois variable systématiquement envoyées aux commandes :

- `ajax` : contient des informations sur l'appel (trigger, méthode...)
- `response` : contient le tableau renvoyé par la classe PHP
- `status` : contient le code HTTP (200, 404...)

## Déclaration d'une librairie

Il faut ensuite ajouter le fichier qui contient la/les commande(s) à une librairie, et la déclarer dans votre module. Créons le fichier de librairies, s'il n'existe pas déjà dans le module :

    # web/modules/custom/ajaxextended/ajaxextended.libraries.yml
    ajaxextended.commands:
      version: 1.x
      js:
        js/commands.js: {}
      dependencies:
        - core/drupal.ajax

La librairie a pour identifiant `ajaxextended.commands` (ce nom ne doit pas nécessairement être le même que votre fichier JavaScript), et pour dépendance `core/drupal.ajax`.

## Chargement de la librairie

La librairie est à présent prête à être utiliser, il va falloir l'ajouter dans le tableau de rendu des fonctions de Controller qui en auront besoin (là où se trouvent les boutons qui vont déclencher les appels AJAX). Un exemple ci-dessous :

    public function renderCall()
    {
        $render = array();
        // ...

        $render['#attached']['library'][] = 'ajaxextended/ajaxextended.commands';
        return $render;
    }

## Utilisation de la commande

Ne reste à présent plus qu'à utiliser la commande dans les fonctions de Controller qui reçoivent les appels ajax :

    public function ajaxCall($buttonId)
    {
        // ...

        $response = new AjaxResponse();
        $response->addCommand(new RemoveFeedbackClassesCommand(sprintf('#%s', $buttonId)));
        return $response;
    }

## Liens :

[L'API AJAX de Drupal 8](https://api.drupal.org/api/drupal/core%21core.api.php/group/ajax)
[La liste des commandes AJAX](https://github.com/drupal/drupal/tree/8.5.x/core/lib/Drupal/Core/Ajax)
