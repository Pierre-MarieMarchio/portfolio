# 03 — Services, états ngx-statewise, nommage

Rapport d'agent, en lecture seule. Périmètre :

- `core/**` ;
- `features/*/states/**` ;
- `features/projects/{services,models}` et `features/station/models` ;
- `features/common` ;
- `app.config.ts`, `app.routes*.ts`, `app.navigation.ts`, `environments/`.

Point revérifié : `LocalStorageService`, `json.utils` et `refusalReason`
n'ont aucun consommateur hors de leur propre barrel.

## Constats

**1. [I] La règle « un cran en arrière » est écrite plusieurs fois.**
`station.effect.ts:54-63` (`voidEffect`) décide ce que ferme un clic dans le
vide, et `station.component.ts:134-141` (`voidCloses`) refait le calcul. La
table vue → parent est aussi recopiée dans `closeEffect` (l. 26-37) et
`escapeEffect` (l. 40-52).

Correction : une fonction pure
`stepBack(view, selection, preview): 'deselect' | 'close-preview' | url | null`,
utilisée par les effects, avec un `canStepBack` exposé par le manager.

**2. [I] Trois écrivains du `<head>`, et un format de titre copié.**
`page-title.strategy.ts:22-24` construit le titre, et
`project-detail-page.component.ts:66` le reconstruit à la main, puis appelle
`Title` et `SeoService.name` (l. 62-71). D'une fiche à l'autre, la strategy
réécrit « Projet · … » après chaque navigation : le résultat dépend de
l'ordre d'exécution.

Correction :

- un `ResolveFn<string>` sur `projet/:slug` ;
- supprimer l'effect de la page ;
- `SeoService` est fusionné dans la strategy, ou renommé `PageHead`, avec
  `set({ title, description })` comme seule méthode.

**3. [C] `environment.SITE_NAME` n'est pas une donnée d'environnement.**
`angular.json` n'a aucun `fileReplacements`. Correction : une constante dans
`core/`, et supprimer `environments/`.

**4. [I] Code mort ou spéculatif (YAGNI).**

- **`local-storage.service.ts` (76 l.) et `json.utils.ts`.** Aucune
  sous-classe, aucun import, alors que `README.md:112` s'en réclame.
  Correction : supprimer.
- **`refusal-reason.ts` et la branche `HttpErrorResponse` de
  `reported-errors.service.ts:48-50`.** Il n'y a aucun appel HTTP, et le texte
  de repli français est dans `core`. Correction : supprimer.
- **`ReportedErrors.all` et `clear()` (l. 23, 36).** Ni lus ni rendus, alors
  que le commentaire affirme « a view can render it »
  (`app-error-handler.ts:7`). Correction : un vrai lecteur, par exemple un
  panneau dans `/atelier`, ou un handler qui se contente de journaliser.
- **`ProjectsManager.isLoading`, `isError` et `reset()` (l. 30-31, 119).**
  Seuls les specs et les doubles les lisent. Un échec de chargement donne une
  page vide et muette : acceptable avec des données statiques, mais c'est un
  motif du showcase porté sans besoin.

**5. [I] La chaîne d'erreur n'est tenue par aucun spec.** Il n'existe pas
de `app-error-handler.spec.ts` : le principe 8 de la passation (« les erreurs
deviennent de l'état ») n'est prouvé nulle part.

**6. [I] `BrowserEnvironment` : un port justifié, mais une porte ouverte.**
`browser-environment.service.ts:14-15` expose `document` et `isBrowser`. De
son côté, `object.component.ts:238,353,390,430,457` fait des
`querySelectorAll` et écrit `body.style.cursor` au travers.

- Le découper en trois services créerait trois fichiers de 40 lignes pour un
  seul invariant (être inerte au prérendu) : c'est excessif.
- Verdict : **garder et resserrer**. `document` passe en privé, avec
  `setCursor()` et `queryAll()`, ou bien les accès passent par
  `Renderer2`/`ElementRef`.
- Plus tard, un `CanvasEnvironment` local à l'objet.
- Défaut mineur : `mediaQuery` (l. 246) lit `document.defaultView` au lieu de
  `view()`.

**7. [C] `ScrollMemory` est mal placé.** Son seul client est
`shared/ui/window/window.component.ts:65`, et son commentaire parle de
« reading surface ». Correction : le déplacer dans `shared/ui/window/`.

**8. [C] Nommage.**

- **Suffixes de classes incohérents.** `BrowserEnvironment`, `ReportedErrors`
  et `ScrollMemory` n'ont pas de suffixe, `SeoService`,
  `LocalStorageService` et `ProjectsRepositoryService` en ont un. Choisir une
  règle, par exemple `PageHead` et `ProjectsRepository`.
- **`page-title.strategy.ts`.** Le suffixe `.strategy.ts` n'est pas dans la
  convention, et le fichier vit dans `services/`.
- **« Rang » a deux sens.** `ProjectsManager.rankOf` compte à partir de 1 et
  renvoie 0 pour un slug inconnu (`projects.manager.ts:94`), alors que le
  `rankOf` de `station.component.ts:333` compte à partir de 0 et renvoie -1.
- **Manager station.** `navigated()` est un événement au passé utilisé comme
  commande, et `clickVoid` nomme le geste au lieu de l'intention.
  Propositions : `syncRoute`, `stepBack`, et le couple `togglePreview` /
  `openPreview`.
- **Actions.** `stationEscaped` et `stationVoidClicked` codent le
  périphérique : ne les garder que si leur différence est voulue et
  documentée.
- **Champs d'état.** `reading` → `lastPreviewed`, `slug` → `sheetSlug`,
  `family` → `indexFilter`.

**9. [C] État de station en chaînes.** `part = signal('00')`
(`station.state.ts:37`) est reconverti en nombre dans
`station.component.ts:173-176` : stocker un nombre. En revanche, `family` en
chaîne opaque est justifié, parce que la station ne doit pas connaître
`ProjectFamily`.

**10. [C] StationState : ne pas découper.** Il porte 13 signaux et 6
sous-concepts, mais `stationNavigated` (`station.updater.ts:20-39`) les
réinitialise d'un coup. Le découper imposerait des cascades entre managers.

- Le routage dans l'effect est correct.
- `StationEffect` peut lire `StationState` : même feature, lecture seule.
- Réserve : `englishAsked` est un état global pour une fonction qui n'existe
  pas encore.

**11. [I] Le catalogue des projets manque de cohésion.** `ProjectCatalog`
(`project-catalog.model.ts:15-19`) mélange des données par projet et du
texte statique d'interface (`proofLevelLabels`, `defaultChapterTitles`,
`layers`). Ce texte traverse le cycle de chargement, occupe trois signaux et
un `NO_PROOF_LEVEL_LABELS`, sans jamais varier.

- Correction : sortir ces textes du state (ils rejoignent le catalogue de
  langue).
- Le reste de la surface du manager est justifié. Il manque seulement un type
  `ProjectSlug` à la place de `Record<string, …>`.

## Verdicts

| Élément                          | Verdict                                                          |
| -------------------------------- | ---------------------------------------------------------------- |
| BrowserEnvironment               | garder, resserrer `document`                                     |
| LocalStorageService + json.utils | supprimer                                                        |
| ReportedErrors                   | garder si un lecteur existe, sinon supprimer ; tester le handler |
| refusalReason                    | supprimer                                                        |
| ScrollMemory                     | déplacer dans `shared/ui/window`                                 |
| SeoService                       | renommer `PageHead`, seul propriétaire du `<head>`               |
| PageTitleStrategy                | garder, déléguer à `PageHead`, un resolver pour les fiches       |
| ProjectsRepositoryService        | garder, renommer selon la convention retenue                     |
| ProjectsManager                  | garder, alléger (les textes statiques sortent du state)          |
| StationState/Manager/Effect      | un seul état ; factoriser `stepBack`, renommer                   |
| environment                      | remplacer par une constante `SITE_NAME`                          |
| features/common                  | garder (vide et documenté)                                       |
