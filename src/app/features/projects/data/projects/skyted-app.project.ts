import { ProjectEntry } from '../../models';

/** Skyted App: identity, facts and sheet, in one place. */
export const SKYTED_APP: ProjectEntry = {
  project: {
    slug: 'skyted-app',
    title: 'Skyted App',
    short: 'Skyted App',
    tag: 'publié',
    family: 'professional',
    subject:
      'L’application de gestion du casque Skyted 320 : appairage et enregistrement de l’appareil, niveau de batterie, compte utilisateur, module d’entraînement à la voix basse, boucle de retour audio, et affichage en temps réel de la distance à laquelle la voix reste perceptible.',
    summary: 'compagnon du casque 320',
  },
  facts: {
    proof: 'Publiée · deux magasins',
    proofLevel: 'public',
    role: 'Reprise, puis livraisons',
    stack: 'Swift · Kotlin · BLE',
    context: 'Skyted',
  },
  sheet: {
    lede: 'L’application compagnon du casque Skyted 320 : elle gère l’appareil, entraîne à parler bas, et affiche jusqu’où la voix porte réellement.',
    links: [
      {
        label: 'skyted.io',
        href: 'https://www.skyted.io/',
      },
    ],
    chapters: [
      {
        paragraphs: [
          'Un casque qui promet des appels discrets ne suffit pas : encore faut-il que la personne sache à quel volume parler. Sans retour, on surestime ou on sous-estime sa propre voix, et la promesse de confidentialité ne tient plus.',
          'L’application analyse simultanément la voix et le bruit ambiant, puis affiche deux distances : celle à partir de laquelle une personne proche pourrait comprendre, et celle à partir de laquelle la voix pourrait devenir gênante.',
        ],
      },
      {
        paragraphs: [
          'J’ai repris l’application après le départ du développeur précédent. Prendre en main une base que je n’avais pas écrite, la faire tenir, puis y ajouter des fonctionnalités et livrer plusieurs versions en production.',
          'Elle est développée en natif : Swift côté iOS, Kotlin côté Android.',
        ],
        bullets: [
          {
            term: 'appairage',
            text: 'enregistrement de l’appareil et mises à jour du micrologiciel',
          },
          {
            term: 'état',
            text: 'niveau de batterie, compte utilisateur',
          },
          {
            term: 'mesure',
            text: 'distances d’intelligibilité et de gêne, en temps réel',
          },
          {
            term: 'apprentissage',
            text: 'entraînement à la voix basse, retour audio dans le casque',
          },
        ],
      },
      {
        paragraphs: [
          'L’application existait déjà, en Swift d’un côté et en Kotlin de l’autre. La tentation, en reprenant une base qu’on n’a pas écrite, est de la réécrire dans une technologie unique.',
          'Je ne l’ai pas fait. La liaison au matériel — appairage, micrologiciel, flux audio — passe par les API Bluetooth de chaque système ; une couche partagée les aurait recouvertes d’une abstraction de plus, sur un produit déjà en vente. Le coût assumé : tout s’écrit deux fois, et chaque livraison se fait deux fois.',
        ],
      },
      {
        paragraphs: [
          'Ce qui existe : une application publiée sur les deux magasins, liée à un produit matériel commercialisé, et des livraisons successives que j’ai assurées.',
          'Ce qui n’est pas démontré ici : la précision réelle des distances affichées, l’adoption, et la part du traitement qui relève du casque plutôt que de l’application.',
        ],
      },
    ],
  },
};
