# Le contenu du site : où il vit, comment le changer

Ce guide s'adresse à qui veut changer le contenu sans connaître le code. Il dit
quel fichier ouvrir, quoi y écrire, et ce que `npm run check` vérifie ensuite.

## Ajouter un projet

Un projet s'écrit **dans un seul fichier**, puis se range **à une seule ligne**.

1. Créez `src/app/features/projects/data/projects/<slug>.project.ts`, en
   partant d'un projet voisin. Le `slug` est l'adresse de la fiche
   (`/projet/<slug>`) : des minuscules, des chiffres et des tirets.

   ```ts
   import { ProjectEntry } from '../../models';

   /** Mon projet : identité, faits et fiche, au même endroit. */
   export const MON_PROJET: ProjectEntry = {
     project: {
       slug: 'mon-projet',
       title: 'Mon projet',
       short: 'Mon projet', // le nom court : l'étiquette de la planète
       tag: 'open source', // un mot d'état
       family: 'personal', // 'professional' ou 'personal'
       subject: 'Ce qu’est le projet, en une phrase.',
       summary: 'le même, en quelques mots',
     },
     facts: {
       proof: 'Dépôt public · npm', // ce qu'un lecteur peut vérifier
       proofLevel: 'public', // 'public', 'indirect' ou 'none'
       role: 'Seul, de bout en bout',
       stack: 'Angular · TypeScript',
       context: 'Personnel',
     },
     sheet: {
       lede: 'Le chapô de la fiche.',
       links: [{ label: 'dépôt', href: 'https://…' }],
       chapters: [{ paragraphs: ['Pourquoi ce projet…'] }, { paragraphs: ['Ce que j’ai fait…'] }],
     },
   };
   ```

2. Ajoutez-le à la liste de `src/app/features/projects/data/projects.data.ts`,
   à sa place : **l'ordre de la liste est le rang**, c'est-à-dire la distance
   au centre de l'objet et l'ordre de lecture partout ailleurs.

C'est tout. La page `/projet/<slug>` est prérendue d'elle-même, le relevé,
les compteurs, la règle, l'objet et la phrase « aucune des NN fiches » suivent.

**Ce qui est refusé.** Le type `ProjectEntry` exige l'identité, les faits et
la fiche : un projet sans faits ou sans fiche ne compile pas, et
`npm run check` échoue. Un slug déjà pris ou mal formé fait échouer
`projects.data.spec.ts`. Une fiche prérendue sans sa fenêtre fait échouer
`check-prerender`.

**Les chapitres.** Un chapitre sans `title` prend le titre par défaut de sa
place (« Pourquoi ? », « Qu’ai-je fait ? », « Quel arbitrage ? »,
« Qu’est-ce qui tient ? »). Un chapitre peut porter une liste (`bullets`, des
paires terme / texte) et une figure :

- `{ kind: 'flow', steps: ['a', 'b'], loop: '…', caption: '…' }` : des étapes
  en séquence, puis ce vers quoi elles bouclent ;
- `{ kind: 'layers', layers: [{ name, projects }], caption: '…' }` : les
  couches d'une architecture.

Une figure est un schéma de lecture, jamais une capture présentée comme une
preuve. Les faits (preuve, rôle, technique, contexte) ne se répètent jamais
dans la fiche : la fiche les lit dans `facts`.

## Changer les projets mis en avant

Les projets mis en avant à l'accueil sont les premiers du rang. Leur nombre
est **une seule valeur**, `FEATURED_COUNT`, dans
`src/app/features/projects/states/projects/projects.manager.ts`. L'aperçu, la
règle, le rideau et les planètes mises en avant suivent.

Pour changer _lesquels_ sont mis en avant, changez l'ordre de la liste de
`projects.data.ts`.

## Changer un texte

Le site existe en français (à la racine) et en anglais (sous `/en`).

- **Un texte d'un projet** (titre court, sujet, preuve, chapô, paragraphes,
  légendes…) est dans le fichier de ce projet, les deux langues côte à côte :
  `{ fr: '…', en: '…' }`. Un texte identique dans les deux langues (un nom, une
  pile technique) s'écrit une seule fois, en simple chaîne.
- **Tout autre texte de l'interface**, `aria-label` et `title` compris, est dans
  `src/app/i18n/fr.ts` pour le français et `src/app/i18n/en.ts` pour l'anglais.
  Les deux fichiers ont la même forme : une clé ajoutée à l'un et oubliée dans
  l'autre ne compile pas. Un texte qui porte une valeur (un nombre, un titre)
  est une petite fonction : ``(count) => `${count} fiches` ``.

Aucun gabarit n'est à ouvrir pour changer un texte.

**Relire l'anglais.** L'anglais a été rédigé sans relecture : chaque texte est
marqué `draft('…')`. Pour en valider un, retirez l'appel à `draft(` (gardez le
texte), puis mettez à jour le nombre attendu dans
`src/integration/drafts.spec.ts`, qui compte ceux qui restent.

**Les adresses** des vues, dans les deux langues, sont dans
`src/app/i18n/paths.ts` : les routes, les liens, le sélecteur de langue et
l'en-tête (`canonical`, `hreflang`) en sont tirés.
