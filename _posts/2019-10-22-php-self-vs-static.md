---
layout: post
title:  "PHP : self versus static"
date:   2019-10-22
tags:
- php
description: >
  Quelle est la différence entre self et static, et comment les utiliser ?
---

<aside><p>Articles du dossier :</p>
<p>
<a href="https://blog.smarchal.com/les-traits-php">I - Les traits</a><br>
<strong>II - self versus static</strong>
</p></aside>

Cet article s'inscrit dans un dossier sur les concepts PHP et l'architecture de code, commencé avec un précédent article sur les traits.

## Introduction

Si vous avez déjà fait un peu de POO, vous êtes censés connaître les fonctions et propriétés statiques qui dépendent d'une classe, mais pas d'une instance. Un exemple couramment vu dans les tutoriels est celui du compteur d'instances :

```php
class Mother
{
  protected static int $counter = 0;

  public function __construct()
  {
    self::$counter++;
  }

  public static function count(): int
  {
    return self::$counter;
  }
}

new Mother();
new Mother();
new Mother();

print Mother::count(); // 3
```

<aside><p>Notez au passage l'utilisation d'une propriété typée, feature qui arrive avec PHP 7.4 !</p></aside>

Dans le code ci-dessus, on constate l'utilisation du mot-clé `self` pour accéder à la propriété statique. Certains d'entre-vous auraient peut-être utilisé le mot-clé `static` à la place, ce qui aurait parfaitement fonctionné dans ce cas précis.

Mais alors quelle différence ?

## Les limites de self

Poussons un peu plus loin l'exemple précédent et ajoutons de l'héritage :

```php
class Mother
{
  protected static int $counter = 0;

  public function __construct()
  {
    self::$counter++;
  }

  public static function count(): int
  {
    return self::$counter;
  }
}

class Daughter extends Mother
{
  protected static int $counter = 0;
}
```

On redéfini le compteur dans la classe fille afin de dissocier les instances de `Mother` de celles de `Daughter` dans nos comptes, puis on teste :

```php
new Mother();
new Mother();
new Mother();
new Daughter();

print Mother::count(); // 4
print Daughter::count(); // 4
```

On constate que les deux compteurs ont la même valeur, mais voici ce qu'il se passe réellement : **on utilise le même compteur**. Qu'on utilise `Mother` ou `Daughter`, tous les appels finissent par remonter jusqu'à la fonction `Mother::count()` et dans cette classe, `self` est une référence à elle-même : `Mother`.

Une solution serait de redéfinir les deux fonctions dans la classe fille `Daughter`, mais on perd dans ce cas absolument tout intérêt à utiliser de l'héritage.

## La notion de "late static binding"

PHP implémente (depuis sa version 5.3.0) le late static binding, ou "résolution statique à la volée" en français. Le principe est de résoudre la classe d'appel au moment de l'exécution : on cherche à trouver la classe **active** lors de l'appel, et non pas celle dans laquelle est définie la fonction (ou propriété) statique appelée.

Dans des termes plus techniques, le site [php.net](https://www.php.net/manual/fr/language.oop5.late-static-bindings.php) précise que le mot-clé `static` comme contient une référence à la classe active lors du "dernier appel non transmis".

> Un "appel transmis" est un appel statique déclenché par `self::`, `parent::`, `static::` ou, tout en haut de la hiérarchie des classes, `forward_static_call()`.

Lorsque vous utiliser l'appel ci-dessous, c'est un appel non transmis car il s'effectue sur une classe :

```php
print Daughter::count();
```

Comme il s'agit d'une fonction héritée, le contenu de cette fonction dans le contexte de la classe fille est implicitement le suivant :

```php
public static function count(): int
{
  return parent::count();
}
```

Ce second appel est un appel transmis car il s'effectue sur le mot-clé `parent`. La classe active (`Daughter`) est bien différente de la classe de définition (`Mother`), et c'est là que le mot-clé `static` va être utile.

## `self` versus `static`

Pour résumé ce que nous venons de voir :
- `self` permet d'accéder à la classe dans laquelle ce mot-clé est écrit
- `static` permet d'accéder à la classe active lors de l'exécution

En reprenant toujours le même exemple, pour avoir deux compteurs différents il faudrait procéder comme ceci (on change simplement tous les `self::$counter` en `static::$counter`) :

```php
class Mother
{
  protected static int $counter = 0;

  public function __construct()
  {
    static::$counter++;
  }

  public static function count(): int
  {
    return static::$counter;
  }
}

class Daughter extends Mother
{
  protected static int $counter = 0;
}


new Mother();
new Mother();
new Mother();
new Daughter();

print Mother::count(); // 3
print Daughter::count(); // 1
```

L'utilisation du mot-clé `static` permettra de faire appel au compteur de la classe `Daughter` : la classe active, celle que nous utilisons vraiment.

## `get_called_class()`

Il est bon de noter que PHP 5.3.0 introduit en même temps la fonction `get_called_class()` qui permet de récupérer le nom de cette classe active.

## Cas pratique

En pratique, j'utilise beaucoup et principalement le late static binding avec des classes abstraites.

Prenons un nouvel d'exemple, avec une architecture de classes sœurs définissant des APIs. Suivant le principe DRY (Don't Repeat Yourself), je vais chercher à rendre mon code le plus abstrait possible et à le centraliser dans une classe mère (généralement abstraite), afin de simplifier au maximum la création de futures classes d'APIs. Je pourrais avoir une architecture de ce type :

```
src/
  Api/
    AbstractApi.php
    Customers.php
    Orders.php
    Products.php
```

Pour chacune de mes APIs et partant du principe que j'ai mis en place un routeur, je vais aller définir son namespace et sa racine (l'URL sur laquelle je pourrais appeler cette API). Pour les besoin de cet exemple, je ne vais évidemment utiliser que des fonctions statiques :

```php
abstract class AbstractApi
{
  const VERSION = 'v1';
}

class Customers extends AbstractApi
{
  protected static function namespace(): string
  {
    return 'clients';
  }

  public static function root(): string
  {
    return sprintf('api/%s/%s', self::VERSION, self::namespace());
  }
}

class Orders extends AbstractApi
{
  protected static function namespace(): string
  {
    return 'orders';
  }

  public static function root(): string
  {
    return sprintf('api/%s/%s', self::VERSION, self::namespace());
  }
}

class Products extends AbstractApi
{
  protected static function namespace(): string
  {
    return 'products';
  }

  public static function root(): string
  {
    return sprintf('api/%s/%s', self::VERSION, self::namespace());
  }
}
```

Je me rend vite compte de deux problèmes :
- la fonction `root()` est toujours identique, mais je ne peux pas la définir dans `AbstractApi` à cause de l'utilisation de `self::namespace()`
- la plupart du temps `namespace()` renvoie le nom de la classe en minuscules (sauf pour `Customers` où j'ai voulu utiliser `clients` pour une raison quelconque)

Pour améliorer tout ça, je déplace donc ces deux fonctions vers la classe mère, en veillant bien à utiliser le mot-clé `static` pour que les surcharges éventuelles des classes filles soient appelées :

```php
abstract class AbstractApi
{
  const VERSION = 'v1';

  protected static function namespace(): string
  {
    return strtolower(get_class_name());
  }

  public static function root(): string
  {
    return sprintf('api/%s/%s', self::VERSION, static::namespace());
  }
}

class Customers extends AbstractApi
{
  protected static function namespace(): string
  {
    return 'clients';
  }
}

class Orders extends AbstractApi {}

class Products extends AbstractApi {}
```

Et voilà !

```php
print Customers::root(); // api/v1/clients
print Orders::root();    // api/v1/orders
print Products::root();  // api/v1/products
```

Tout est propre, aucune ligne n'est répétée, et la création d'une nouvelle API est simplifiée sans enlever la possibilité de surcharge.

## Conclusion

Retenez bien la différence entre les deux mots-clés :

- `self` : la classe où ce mot-clé est écrit (classe "courante")
- `static` : la classe appelée pendant l'exécution (class "active")

La grande majorité du temps vous n'aurez besoin que de `self`, mais dès que vous voulez organiser proprement votre code (ou faire un peu de refactoring), vous tomberez forcément sur des situations où vous aurez besoin du mot-clé `static` pour aller plus loin.

## Liens

- [PHP - Static](https://www.php.net/manual/fr/language.oop5.static.php)
- [PHP - Late Static Binding](https://www.php.net/manual/fr/language.oop5.late-static-bindings.php)
- [DRY](http://wiki.c2.com/?DontRepeatYourself)
