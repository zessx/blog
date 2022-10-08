---
layout: post
title:  "La directive map Nginx"
date:   2021-08-01
tags:
- sysadmin
description: >
  À quoi sert la directive map de Nginx, et pourquoi l'utiliser ?
---

## Présentation

La directive `map` permet de créer des variables, dont les valeurs dépendent d'autres variables.

Dit comme ça ce n'est pas forcément très parlant, prenons cet exemple :
```nginx
map $a $b {
  default  0;
  foo      1;
  bar      2;
}
```

Il serait équivalent à ce pseuso-code :
```php
switch ($a) {
  case 'foo': $b = 1; break;
  case 'bar': $b = 2; break;
  default:    $b = 0;
}
```

## Utilisations communes



## Liens :

[Nginx map module documentation](https://nginx.org/en/docs/http/ngx_http_map_module.html)