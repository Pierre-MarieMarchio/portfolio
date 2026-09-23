import { Catalog } from '../models/catalog.model';

/**
 * Every text of the interface, in French: the one file to open to change
 * one. The texts of a project are in its own file (D5). Copied from the
 * export, text for text; the lorem ipsum and the "à renseigner" lines are
 * the mockup's own placeholders (handoff §8), kept until the real text exists.
 */
export const FR: Catalog = {
  shared: {
    window: {
      pin: 'Épingler : garder la fenêtre ouverte en changeant de page',
      unpin: 'Détacher : la fenêtre se refermera en changeant de page',
      fold: 'Replier la fenêtre',
      unfold: 'Déplier la fenêtre',
      close: 'Fermer la fenêtre',
    },
    segmented: { label: 'Sélection' },
    pageBar: {
      languages: 'Langue du site',
      navigation: 'Navigation principale',
    },
    contactRail: {
      label: 'Me contacter',
      pause: 'Mettre l’animation de l’objet en pause',
      resume: 'Reprendre l’animation de l’objet',
    },
  },

  projects: {
    proofLevels: {
      public: 'Ouvrable par vous',
      indirect: 'Vérifiable, code privé',
      none: 'Sur récit seulement',
    },
    defaultChapterTitles: [
      'Pourquoi ?',
      'Qu’ai-je fait ?',
      'Quel arbitrage ?',
      'Qu’est-ce qui tient ?',
    ],
    index: {
      heading: 'Projets · le relevé',
      label: 'Fenêtre : relevé des projets',
      title: (count) => `Projets — le relevé des ${count} réalisations`,
      count: (count) => `${count} fiches`,
      families: {
        label: 'Familles de projets',
        all: { label: 'Tout', aria: 'Voir tous les projets' },
        professional: {
          label: 'En entreprise',
          aria: 'Ne voir que les réalisations faites en entreprise',
        },
        personal: {
          label: 'Personnels',
          aria: 'Ne voir que les projets personnels',
        },
      },
      summary: (professional, personal) =>
        `${professional} en entreprise · ${personal} personnels`,
      columns: ['Réf', 'Projet', 'Ce qu’on peut vérifier', 'Rôle tenu'],
      read: 'lu',
      openSheet: 'Ouvrir la fiche →',
    },
    preview: {
      label: 'Fenêtre : aperçu du projet',
      bodies: 'Corps en orbite',
      body: (number, title) => `Aperçu ${number} — ${title}`,
      terms: { proof: 'Preuve', role: 'Rôle', stack: 'Pile' },
      openSheet: 'Ouvrir la fiche →',
    },
    sheet: {
      label: 'Fenêtre : fiche de projet',
      approaches: 'Approches de la fiche',
      approach: (number, title) => `Approche ${number} — ${title}`,
      terms: {
        access: 'Accès',
        role: 'Rôle',
        stack: 'Technique',
        context: 'Contexte',
      },
      nextApproach: (title) => `Suite : ${title} →`,
      nextProject: (short) => `Suivant : ${short} →`,
    },
    rule: {
      heading: 'Projets en orbite',
      all: 'Tous les projets →',
    },
  },

  desktop: {
    object: {
      select: (number, title) =>
        `Sélectionner ${number} — ${title} dans le relevé`,
      preview: (title) => `Aperçu du projet ${title}`,
      parts: ['Profil', 'Compétences', 'Méthode', 'Parcours'],
    },
    home: {
      void: 'Refermer et revenir à la vue d’ensemble',
      name: 'Pierre-Marie Marchio',
      trade: 'Concepteur développeur d’applications',
      brand: 'Portfolio',
    },
    notFound: {
      heading: 'Adresse inconnue',
      label: 'Fenêtre : adresse inconnue',
      title: 'Cette réalisation n’existe pas.',
      sentence: (count) =>
        `L’adresse demandée ne correspond à aucune des ${count} fiches du relevé.`,
      back: 'Tous les projets →',
    },
  },

  profile: {
    about: {
      heading: 'À propos',
      label: 'Fenêtre : à propos',
      parts: 'Parties du profil',
      title: (part) => `À propos — ${part}`,
      goTo: (part) => `Aller à : ${part}`,
      next: (part) => `Suite : ${part} →`,
      back: 'Tous les projets →',
      profile: {
        label: 'Profil',
        title: 'Profil',
        lead: 'Je viens de l’archéologie. J’en ai gardé une habitude : ne rien affirmer sans preuve.',
        facts: [
          {
            term: 'Poste',
            value: 'Concepteur développeur d’applications, Skyted',
            tone: 'text',
          },
          {
            term: 'Pile',
            value: '.NET · MAUI · Angular · Swift · Kotlin · PostgreSQL',
            tone: 'data',
          },
          {
            term: 'Lieu',
            value: 'Lorem ipsum — ville et mobilité à renseigner',
            tone: 'quiet',
          },
          {
            term: 'Écoute',
            value: 'Lorem ipsum — CDI, mission, freelance : à préciser',
            tone: 'quiet',
          },
        ],
        prose: [
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Deux applications publiées sur les magasins, deux socles open source écrits seul : ce que vous lisez ici est vérifiable en trois clics.',
          'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua, ut enim ad minim veniam quis nostrud exercitation ullamco laboris.',
        ],
      },
      skills: {
        label: 'Compétences',
        title: 'Compétences · ce sur quoi j’ai livré',
        heading: 'Ce sur quoi j’ai livré',
        domains: [
          { label: 'Web', value: 'API .NET, front Angular' },
          {
            label: 'Mobile',
            value: 'applications publiées, liées à un matériel',
          },
          { label: 'Matériel', value: 'intégration Bluetooth Low Energy' },
          { label: 'Desktop', value: 'applications Java Swing' },
          { label: 'Métier', value: 'flux bancaires, compensation européenne' },
        ],
        prose:
          'Lorem ipsum dolor sit amet : chaque ligne renvoie à un projet du relevé, pas à une liste de mots-clés.',
      },
      method: {
        label: 'Méthode',
        title: 'Méthode de travail',
        heading: 'Comment je travaille',
        steps: [
          'Tenir un projet jusqu’à la mise en production : c’est la seule façon d’en voir le coût réel.',
          'Lorem ipsum dolor sit amet — des décisions qu’on explique, du code qu’on peut relire.',
          'Consectetur adipiscing elit — des résultats qu’on peut aller vérifier soi-même.',
        ],
      },
      path: {
        label: 'Parcours',
        title: 'Parcours',
        heading: 'Étapes',
        missing: 'années à renseigner',
        // The facts are known, the dates are not: the place of each date is
        // shown rather than a date made up. To fill in (handoff §8).
        milestones: [
          {
            year: '— — — —',
            fact: 'Archéologie : fouille, relevé, description',
          },
          { year: '— — — —', fact: 'Reconversion vers le développement' },
          {
            year: '— — — —',
            fact: 'Formation — intitulé et établissement à renseigner',
          },
          {
            year: '— — — —',
            fact: 'Numerilis — stage, refonte du back de Bk-ONE',
          },
          {
            year: '— — — —',
            fact: 'Skyted — concepteur développeur d’applications',
          },
        ],
      },
    },
    contact: {
      email: 'M’écrire à pierremariemarchio.pro@gmail.com',
      linkedin: 'Profil LinkedIn de Pierre-Marie Marchio',
      github: 'Dépôts GitHub de Pierre-Marie Marchio',
    },
  },
  pages: {
    heads: {
      home: {
        title: 'Accueil',
        description:
          'Portfolio de Pierre-Marie Marchio, concepteur développeur d’applications.',
      },
      index: {
        title: 'Projets',
        description: 'Les projets de Pierre-Marie Marchio.',
      },
      about: {
        title: 'À propos',
        description: 'Qui est Pierre-Marie Marchio.',
      },
      notFound: { title: 'Adresse inconnue' },
      sheet: { title: 'Projet' },
    },
    skipLink: 'Aller au contenu',
    navigation: { home: 'Accueil', index: 'Projets', about: 'À propos' },
    languages: { fr: 'Français', en: 'English' },
  },
};
