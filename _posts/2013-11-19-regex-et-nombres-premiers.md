---
layout: post
title:  "Regex et nombres premiers"
date:   2013-11-19
tags: 
- regex
- php
- mathematiques
description: >
  Et si une regex pouvait vous permettre d'identifier les nombres premiers ?
---

	echo !preg_match('/^.?$|^(..+)\1+$/', str_repeat('-', $n));

## Une histoire de Perl

Cette petite regex fut créée en Perl par un développeur très doué ([Abigail](https://github.com/Abigail)), en 1998.   
Le script d'origine était remarquable en ce qu'il permettait de savoir si un nombre est premier en une seule ligne de code : 

	perl -wle 'print "Prime" if (1 x shift) !~ /^1?$|^(11+?)\1+$/'

## Hey mais dis-donc Jamy ! Comment ça marche ?

Rappel sur les nombre premiers :
> Un nombre premier est un entier naturel qui admet exactement deux diviseurs distincts entiers et positifs (qui sont alors 1 et lui-même). Ainsi, 1 n'est pas premier car il n'a qu'un seul diviseur entier positif ; 0 non plus car il est divisible par tous les entiers positifs.

On va tout d'abord créer une chaîne de caractère avec `$n` caractères. La regex va ensuite travailler sur cette chaîne pour savoir si le nombre est premier ou non.   
Si on décompose la regex :

	^.?$
Première partie du `OR`, équivalente à `if($n == 0 || $n == 1)`

	^(..+)\1+
Seconde partie, plus intéressante. `\1` est une référence arrière (backreference), qui pointe sur le groupe de capture numéro 1, à savoir `(..+)`. Cette partie de la regex acceptera toute répétition d'un groupe de 2 caractères ou plus. Ce qui nous donne l'équivalent de :

	if( 
		($n%2 == 0 && $n != 2) ||
		($n%3 == 0 && $n != 3) ||
		...
	)

La regex acceptera donc toute chaîne ayant un nombre de caractères égal à :
<ul>
	<li>`0`</li>
	<li>`1`</li>
	<li>`xy`, avec `x != y >= 2`</li>
</ul>
Soit, pour éclaircir : un nombre égal à 0, 1, ou divisible par un autre nombre que lui-même. C'est l'exact opposé d'un nombre entier.   
La regex permet donc d'identifier rapidement les nombres non-premiers. Il suffit juste d'inverser le test pour obtenir les nombres premiers.

## Le cheminement en image :

{:.center}
![Regex et nombres premiers]({{ site.url }}/images/regex-et-nombres-premiers/reg_prime.jpg)

Et ci-dessous, un petit bout de code PHP vous permettant de constater les résultats :

	print("Nombres premiers : ");
	foreach (range(0,500) as $n) {
		if(!preg_match('/^.?$|^(..+?)\1+$/', str_repeat('-', $n)))
			print("$n ");
	}

## Le test inversé

Si vous préférez directement identifier les nombre premiers, renversez le test :

    echo preg_match('/^(?!=^.?$|^(..+)\1+$)/', str_repeat('-', $n));

## Liens
[Polygenelubricants, un blog intéressant tout plein de regex capilotractées et de Java !](http://www.polygenelubricants.com/)   
[Le (vieux) post à l'origine de cette regex](http://diswww.mit.edu/bloom-picayune.mit.edu/perl/10138) (recherchez "Prime")  
[Doc PHP sur les backreferences](https://www.php.net/manual/fr/regexp.reference.back-references.php)  