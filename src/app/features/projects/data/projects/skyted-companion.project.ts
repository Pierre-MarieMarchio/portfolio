import { ProjectEntry } from '../../models';

/** Skyted Companion: identity, facts and sheet, in one place. */
export const SKYTED_COMPANION: ProjectEntry = {
  project: {
    slug: 'skyted-companion',
    title: 'Skyted Companion',
    short: 'Skyted Companion',
    tag: 'interne',
    family: 'professional',
    subject:
      'Application compagnon utilisée en interne autour du casque : appairage, mise à jour du micrologiciel et vérification de l’état de l’appareil.',
    summary: 'compagnon matériel, usage interne',
  },
  facts: {
    proof: 'Interne · non publiée',
    proofLevel: 'none',
    role: 'Développement, en équipe',
    stack: 'Natif · BLE',
    context: 'Skyted',
  },
  sheet: {
    lede: 'L’application compagnon utilisée en interne autour du casque : elle sert à préparer l’appareil, le mettre à jour et vérifier son état.',
    links: [],
    chapters: [
      {
        paragraphs: [
          'Un casque connecté ne se suffit pas à lui-même : il faut pouvoir l’appairer, le mettre à jour, vérifier son état et reproduire un problème signalé. Ce travail n’a pas sa place dans l’application grand public, qui doit rester simple.',
          'C’est le rôle de cette application compagnon : donner accès à l’appareil de près, pour les personnes qui travaillent avec lui.',
        ],
      },
      {
        paragraphs: [
          'J’ai développé des fonctionnalités de cette application au sein de l’équipe mobile, sur les deux plateformes, et suivi la liaison Bluetooth avec l’appareil.',
          'Elle partage son terrain avec l’application publique — mêmes protocoles, même matériel — mais son public est interne, avec des libertés qu’un magasin n’autoriserait pas.',
        ],
      },
      {
        paragraphs: [
          'La question était de savoir jusqu’où exposer l’appareil. Tout montrer rend l’outil puissant et illisible ; ne rien montrer le rend inutile.',
          'J’ai gardé une interface aussi proche que possible de celle de l’application publique, et laissé le reste à l’outillage. Le compromis : certaines opérations demandent encore de passer par un outil séparé.',
        ],
      },
      {
        paragraphs: [
          'Ce qui existe : une application en service en interne, liée au même matériel que l’application publiée.',
          'Ce qui ne peut pas être montré ici : elle n’est pas téléchargeable, et son contenu appartient à l’entreprise. La preuve, dans ce cas, est un récit précis plutôt qu’un lien.',
        ],
      },
    ],
  },
};
