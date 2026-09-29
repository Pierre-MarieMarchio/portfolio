import { Catalog } from '../models/catalog.model';
import { OWNER_NAME } from './owner.data';
import { FR_PROFILE } from './fr-profile.data';

export const FR: Catalog = {
  shared: {
    segmented: { label: 'Sélection' },
    pageBar: {
      languages: 'Langue du site',
      navigation: 'Navigation principale',
      openWindow: 'fenêtre ouverte',
    },
    contactRail: {
      label: 'Me contacter',
    },
  },

  windows: {
    menu: 'Menu de la fenêtre',
    keepOpen: 'Garder ouverte en changeant de page',
    snapLeft: 'Moitié gauche',
    snapRight: 'Moitié droite',
    maximize: 'Agrandir la fenêtre',
    restore: 'Remettre la fenêtre à sa taille',
    close: 'Fermer la fenêtre',
    phone: {
      pin: 'Garder cette fenêtre ouverte en changeant d’onglet',
      unpin: 'Laisser cette fenêtre se fermer en changeant d’onglet',
      fold: 'Baisser la fenêtre',
      unfold: 'Remonter la fenêtre',
    },
    kept: 'Fenêtre gardée',
    released: 'Fenêtre libérée',
  },

  mobileNav: {
    pageOf: (place, count) => `Page ${String(place)} sur ${String(count)}`,
    close: 'Fermer',
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
    },
    preview: {
      label: 'Aperçu du projet',
      bodies: 'Projets mis en avant',
      body: (number, title) => `Projet ${number} : ${title}`,
      previous: (title) => `Projet précédent : ${title}`,
      next: (title) => `Projet suivant : ${title}`,
      terms: { proof: 'Statut', role: 'Rôle', stack: 'Stack' },
      openSheet: 'Voir le projet →',
    },
    sheet: {
      label: 'Détail du projet',
      toIndex: '‹ Projets',
      toIndexLabel: 'Revenir aux projets',
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

  observatory: {
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
      name: OWNER_NAME,
      trade: 'Développeur .NET et Angular',
      status: 'Je cherche le prochain projet à construire.',
      brand: 'Portfolio',
    },
    stepBack: {
      deselect: 'Désélectionner le projet',
      closePreview: 'Fermer l’aperçu',
      overview: '‹ Vue d’ensemble',
    },
    closeTo: {
      home: 'Fermer et revenir à l’accueil',
      index: 'Fermer et revenir aux projets',
    },
    dock: {
      label: 'Fenêtres rangées',
      windows: {
        about: 'À propos',
        index: 'Projets',
        sheet: 'Fiche',
        preview: 'Aperçu',
      },
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
