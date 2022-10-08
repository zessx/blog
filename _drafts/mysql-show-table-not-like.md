---
layout: post
title:  "SHOW TABLES NOT LIKE avec MySQL"
date:   2017-02-01
tags:
- sql
description: >
  Petite astuce pour filtrer vos tables MySQL par nom.
---

## SHOW TABLES LIKE

Au cas où vous ne le sauriez pas, dans votre base de données MySQL il est possible d'afficher toutes les tables dont le nom correspond à un filtre LIKE :

    mysql> SHOW TABLES LIKE "log_%";
    log_orders
    log_products
    log_users

## SHOW TABLES NOT LIKE

Au cas où vous ne le sauriez pas, l'inverse ne fonctionne pas :

    mysql> SHOW TABLES NOT LIKE "log_%";
    #1064 - You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near 'NOT LIKE 'help%'' at line 1

Merde.

En revanche, vous pouvez utilisez la commande suivante (avec une base de données est nommée `mabase`) :

    SHOW TABLES WHERE tables_in_mabase NOT LIKE 'log_%';

## Liens

- [La commande SHOW TABLES](https://dev.mysql.com/doc/refman/5.7/en/show-tables.html)