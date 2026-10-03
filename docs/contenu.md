# Le contenu du site : où il vit, comment le changer

Ce guide s'adresse à qui veut changer le contenu sans connaître le code. Il dit
quel fichier ouvrir, quoi y écrire, et ce que `npm run check` vérifie ensuite.

## Ajouter un projet

Tous les projets sont dans **un seul fichier** :
`src/app/features/projects/data/projects.data.json`, un tableau. Ajouter un
projet, c'est ajouter une entrée, à sa place : **l'ordre du tableau est le
rang**, c'est-à-dire la distance au centre de l'objet et l'ordre de lecture
partout ailleurs.

```json
{
  "project": {
    "slug": "mon-projet",
    "title": "Mon projet",
    "short": "Mon projet",
    "tag": { "fr": "en cours", "enDraft": "in progress" },
    "family": "personal",
    "subject": { "fr": "Ce qu’est le projet, en une phrase.", "enDraft": "…" },
    "summary": { "fr": "le même, en quelques mots", "enDraft": "…" }
  },
  "facts": {
    "proof": { "fr": "Dépôt public · npm", "enDraft": "…" },
    "role": { "fr": "Seul, de bout en bout", "enDraft": "…" },
    "stack": "Angular · TypeScript",
    "context": { "fr": "Personnel", "enDraft": "…" },
    "period": { "fr": "depuis 2025", "enDraft": "…" }
  },
  "detail": {
    "lede": { "fr": "Le chapô de la fiche.", "enDraft": "…" },
    "links": [{ "label": "dépôt", "href": "https://…" }],
    "chapters": [{ "paragraphs": [{ "fr": "Le besoin…", "enDraft": "…" }] }]
  }
}
```

Le `slug` est l'adresse de la fiche (`/projet/<slug>`) : des minuscules, des
chiffres et des tirets. `short` est l'étiquette de la planète, `tag` un mot
d'état, `family` vaut `professional` ou `personal`, `proof` dit ce qu'un
lecteur peut vérifier, `period` dit quand, tel que la fiche l'affiche.

C'est tout. La page `/projet/<slug>` est prérendue d'elle-même, en français et
en anglais ; le relevé, les compteurs, la règle, l'objet et la phrase « Aucun
des NN projets » suivent.

**Ce qui est refusé.** Le fichier est lu par une fabrique
(`features/projects/rules/project-entry.rules.ts`) au build : un champ
manquant ou de mauvais type, un champ inconnu (une faute de frappe), une
famille inconnue, un texte qui porte à la fois `en` et `enDraft`, un slug déjà
pris font échouer le prérendu, donc `npm run check`, avec le projet et le
champ en cause dans le message, par exemple
`mon-projet: facts.role: expected an object, found missing`. Une fiche
prérendue sans sa fenêtre fait échouer `check-prerender`.

**Les chapitres.** Un chapitre sans `title` prend le titre par défaut de sa
place (« Le besoin », « Ce que j’ai fait », « Un choix technique »,
« Aujourd’hui »). Un chapitre peut porter une liste (`bullets`, des
paires terme / texte) et une figure :

- `{ "kind": "flow", "steps": […], "loop": …, "caption": … }` : des étapes en
  séquence, puis ce vers quoi elles bouclent ;
- `{ "kind": "layers", "layers": [{ "name": …, "projects": … }], "caption": … }` :
  les couches d'une architecture.

Une figure est un schéma de lecture, jamais une capture présentée comme une
preuve. Les faits (preuve, rôle, technique, contexte, période) ne se
répètent jamais dans la fiche : la fiche les lit dans `facts`.

## Changer les projets mis en avant

Les projets mis en avant à l'accueil sont les premiers du rang. Leur nombre
est **une seule valeur**, le jeton `FEATURED`, dans
`src/app/features/projects/states/projects/projects.manager.ts`. L'aperçu, la
règle, le rideau et les planètes mises en avant suivent.

Pour changer _lesquels_ sont mis en avant, changez l'ordre du tableau de
`projects.data.json`.

## Changer un texte

Le site existe en français (à la racine) et en anglais (sous `/en`).

- **Un texte d'un projet** (titre court, sujet, preuve, chapô, paragraphes,
  légendes…) est dans l'entrée de ce projet de `projects.data.json`, les deux
  langues côte à côte : `{ "fr": "…", "en": "…" }`. Un texte identique dans les
  deux langues (un nom, une pile technique) s'écrit une seule fois, en simple
  chaîne.
- **Tout autre texte de l'interface**, `aria-label` et `title` compris, est dans
  `src/app/i18n/data/fr.data.ts` pour le français et `en.data.ts` pour
  l'anglais, sauf ceux de la page À propos, dans `fr-profile.data.ts` et
  `en-profile.data.ts`. Les deux langues ont la même forme : une clé ajoutée à l'un et oubliée dans
  l'autre ne compile pas. Un texte qui porte une valeur (un nombre, un titre)
  est une petite fonction : ``(count) => `${count} projets` ``.

Aucun gabarit n'est à ouvrir pour changer un texte.

**Relire l'anglais.** L'anglais a été rédigé sans relecture. Dans les
catalogues d'interface, chaque texte est marqué `draft('…')` : pour en valider
un, retirez l'appel à `draft(` (gardez le texte), puis baissez de un le nombre
attendu `INTERFACE_DRAFTS` de `src/testing/integration/drafts.spec.ts`. Dans
`projects.data.json`, un texte en brouillon s'écrit `"enDraft"` : pour le
valider, renommez la clé en `"en"`, rien d'autre ; le compte des projets suit
le fichier.

**Les adresses** des vues, dans les deux langues, sont dans
`src/app/i18n/data/paths.data.ts` : les routes, les liens, le sélecteur de langue et
l'en-tête (`canonical`, `hreflang`) en sont tirés.
