# Documentation

Tout ce qui décrit le projet sans être du code. Le `README.md` à la racine dit
comment lancer le projet et résume l'architecture ; ce dossier garde les
documents de référence dont elle découle.

```
docs/
  architecture/
    passation-showcase.md     la référence d'architecture : couches, loi de
                              dépendance, ngx-statewise, SSR, outillage
  maquette/                   le design du site (« la station »), à implémenter
    README.md                 à lire d'abord : ce qui est là, ce qui manque
    passation-la-station.md   le design : routes, jetons, composants, comportements
    decoupage-angular.md      le découpage Angular proposé et l'ordre de travail
    composants/
      fenetre.dc.html         le prototype du composant fenêtre
    captures/                 23 captures, une par vue et par état (924 × 540)
```

## Quel document fait foi

| Question                                | Document                             |
| --------------------------------------- | ------------------------------------ |
| Où ranger un fichier, qui importe quoi  | `architecture/passation-showcase.md` |
| À quoi ressemble et se comporte le site | `maquette/passation-la-station.md`   |
| Dans quel ordre implémenter la maquette | `maquette/decoupage-angular.md` (§4) |

Quand la maquette propose une arborescence (`decoupage-angular.md` §3 :
`objet/`, `vues/`, `chassis/`…), **c'est l'architecture qui l'emporte** : la
maquette le dit elle-même (« suis les conventions de ton projet si elles
divergent »). Ses composants se rangent dans les couches existantes
(`shared/ui/`, `features/`, `pages/`), sous la loi de dépendance.

Les documents de passation sont conservés tels qu'ils ont été reçus ; ce qui a
changé depuis est noté dans les `README.md` de ce dossier, pas réécrit dedans.
