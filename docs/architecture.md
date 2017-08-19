# Architecture
Ce projet est constitué d'un serveur hébergé sur un raspberry.

Il sert à 3 types de cas d'usage :
1. Depuis chez eux, ou n'importe où, les animateurs viennent préparer leurs sujets pour l'émission
2. En live depuis le canapé, les animateurs peuvent piloter les titres et incrusts affichées
3. le PC de la régie capte une page consituée dynamiquement par les titres + incrusts en cours d'affichage (en overlay)

![architecture](http://chriscamicas.github.io/docs/global_architecture.svg)

# Stack technique
## Backend
Node + Express + Socket.io
Le stockage est actuellement dans MongoDB.
Le choix de mongodb est du principalement à la facilté d'y stocker nativement du JSON, ainsi que la capacité à stocker des images (les incrusts, logo, etc.).

La communication avec le front se fait :
- par API REST pour les manipulations de données en base
- par socket.io pour le pilotage en live

## Frontend
Le frontend est pour le moment découpé en 3 pages HTML suivant les cas d'usages.
1. une page `emissions.html` qui est la partie préparation
2. une page `presentateur.html` qui est l'interface de pilotage du live
3. une page `xsplit.html` qui est la page intégrée en overlay dans le logiciel d'enregistrement (XSplit)

Le frontend utilise VueJS pour l'aspect dynamique, principalement car j'avais envie de tester ce framework, mais aussi par son aspect léger.