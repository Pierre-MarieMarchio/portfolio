import { Catalog } from '../models/catalog.model';
import { FR_PROFILE } from './fr-profile.data';

export const FR: Catalog = {
  shared: {
    segmented: { label: 'Sélection' },
    pageBar: {
      languages: 'Langue du site',
      navigation: 'Navigation principale',
    },
    contactRail: {
      label: 'Me contacter',
    },
  },

  windows: {
    pin: 'Garder cette fenêtre ouverte en changeant de page',
    unpin: 'Laisser cette fenêtre se fermer en changeant de page',
    fold: 'Replier la fenêtre',
    unfold: 'Déplier la fenêtre',
    close: 'Fermer la fenêtre',
  },

  projects: {
    defaultChapterTitles: [
      'Le besoin',
      'Ce que j’ai fait',
      'Un choix technique',
      'Aujourd’hui',
    ],
    index: {
      heading: 'Projets',
      label: 'Liste des projets',
      title: (count) => `Les ${count} projets`,
      count: (count) => `${count} projets`,
      families: {
        label: 'Filtrer les projets',
        all: { label: 'Tous', aria: 'Afficher tous les projets' },
        professional: {
          label: 'En entreprise',
          aria: 'Afficher les projets faits en entreprise',
        },
        personal: {
          label: 'Personnels',
          aria: 'Afficher les projets personnels',
        },
      },
      summary: (professional, personal) =>
        `${professional} en entreprise · ${personal} personnels`,
      columns: ['N°', 'Projet', 'Statut', 'Mon rôle'],
      read: 'consulté',
      openSheet: 'Voir le projet →',
    },
    preview: {
      label: 'Aperçu du projet',
      bodies: 'Projets mis en avant',
      body: (number, title) => `Projet ${number} : ${title}`,
      terms: { proof: 'Statut', role: 'Rôle', stack: 'Stack' },
      openSheet: 'Voir le projet →',
    },
    sheet: {
      label: 'Détail du projet',
      approaches: 'Parties',
      approach: (number, title) => `Partie ${number} : ${title}`,
      terms: {
        access: 'Statut',
        role: 'Rôle',
        stack: 'Stack',
        context: 'Contexte',
        period: 'Période',
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
    animation: {
      pause: 'Mettre l’animation en pause',
      resume: 'Relancer l’animation',
    },
    object: {
      select: (_number, title) => `Afficher ${title} dans la liste`,
      preview: (title) => `Aperçu du projet ${title}`,
      parts: ['Profil', 'Compétences', 'Parcours', 'Et après'],
    },
    home: {
      void: 'Fermer les fenêtres',
      name: 'Pierre-Marie Marchio',
      trade: 'Développeur .NET et Angular',
      status: 'Je cherche le prochain projet à construire.',
      brand: 'Portfolio',
    },
    notFound: {
      heading: 'Page introuvable',
      label: 'Page introuvable',
      title: 'Rien en orbite à cette adresse.',
      sentence: (count) =>
        `Aucun des ${count} projets ne correspond à ce lien.`,
      back: 'Tous les projets →',
    },
  },

  profile: FR_PROFILE,

  pages: {
    heads: {
      home: {
        title: 'Accueil',
        description:
          'Pierre-Marie Marchio, développeur .NET et Angular à Toulouse, en recherche d’alternance. Ses projets web, desktop et mobiles.',
      },
      index: {
        title: 'Projets',
        description:
          'Les projets de Pierre-Marie Marchio, en entreprise et personnels, avec ce qu’il y a fait.',
      },
      about: {
        title: 'À propos',
        description:
          'Parcours, compétences et recherche d’alternance de Pierre-Marie Marchio, développeur à Toulouse.',
      },
      notFound: { title: 'Page introuvable' },
      sheet: { title: 'Projet' },
    },
    skipLink: 'Aller au contenu',
    navigation: { home: 'Accueil', index: 'Projets', about: 'À propos' },
    languages: { fr: 'Français', en: 'English' },
  },
};
