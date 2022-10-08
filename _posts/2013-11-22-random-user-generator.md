---
layout: post
title:  "Random User Generator"
date:   2013-11-22
tags:
- js
- html
description: >
  Présentation d'un service bien utile, qui vous permet de générer de faux utilisateurs, à utiliser en guise de placeholders.
---

## Présentation de Random User Generator

[Random User generator](https://randomuser.me), c'est une simple url que vous appeler pour obtenir un utilisateur aléatoire. Pour obtenir un utilisateur, il suffit par exemple de faire un petit appel AJAX :

```js
$.ajax({
  url: 'https://api.randomuser.me/0.2/',
  dataType: 'json',
  success: function(data){
    console.log(data);
  }
});
```

Vous obtenez un objet JSON formaté comme ci-dessous :

```json
{
  "results": [{
    "user": {
      "gender": "female",
      "name": {
        "title": "mrs",
        "first": "kathy",
        "last": "foster"
      },
      "location": {
        "street": "7159 edwards rd",
        "city": "seymour",
        "state": "pennsylvania",
        "zip": "37284"
      },
      "email": "kathy.foster77@example.com",
      "password": "godfather",
      "md5 hash": "15d628391f0eb58d7724041ab9a12ae2",
      "sha1 hash": "58be9e2c7f22cd75d7af3c9e175b6465b280d61d",
      "phone": "(471)-543-4073",
      "cell": "(651)-308-4754",
      "SSN": "160-76-1677",
      "picture": "https://randomuser.me/api/portraits/women/22.jpg"
    },
    "seed": "tinyGoose"
  }]
}
```

Et vous n'avez plus qu'à l'utiliser pour combler les vides nécessaire !

```js
var user = data.results[0].user;
$('#picture')
  .attr('src', user.picture)
  .attr('alt', user.name.first+' '+user.name.last);
```

## Quelques options

L'url dispose de quelques options, afin d'affiner les profils que vous désirer récupérer :
- `gender` : vous permet de choisir le genre de l'utilisateur (`female` ou `male`)
- `results` : vous permet de récupérer plusieurs utilisateur d'un seul coup (de `1` à `5`)
- `seed` : associe une chaîne de caractère à un utilisateur. Réutiliser la même `seed` renverra le même utilisateur

## Exemple de fonctionnement

<center><iframe src="{{ site.url }}/demos/random-user-generator/index.html" width="600" height="200"></iframe></center>

## Liens
[**Démonstration**](https://blog.smarchal.com/demos/random-user-generator/index.html)
[Le site de Random User generator](https://randomuser.me)
