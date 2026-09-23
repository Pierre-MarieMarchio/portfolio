import { draft } from '@app/core/i18n';
import { ProjectEntry } from '../../models';

/** Skyted App: identity, facts and sheet, in one place. */
export const SKYTED_APP: ProjectEntry = {
  project: {
    slug: 'skyted-app',
    title: 'Skyted App',
    short: 'Skyted App',
    tag: { fr: 'publié', en: draft('published') },
    family: 'professional',
    subject: {
      fr: 'L’application de gestion du casque Skyted 320 : appairage et enregistrement de l’appareil, niveau de batterie, compte utilisateur, module d’entraînement à la voix basse, boucle de retour audio, et affichage en temps réel de la distance à laquelle la voix reste perceptible.',
      en: draft(
        'The management application of the Skyted 320 headset: pairing and registering the device, battery level, user account, a whisper training module, an audio feedback loop, and a real-time display of the distance at which the voice can still be heard.',
      ),
    },
    summary: {
      fr: 'compagnon du casque 320',
      en: draft('companion of the 320 headset'),
    },
  },
  facts: {
    proof: {
      fr: 'Publiée · deux magasins',
      en: draft('Published · both stores'),
    },
    proofLevel: 'public',
    role: {
      fr: 'Reprise, puis livraisons',
      en: draft('Taken over, then releases'),
    },
    stack: 'Swift · Kotlin · BLE',
    context: 'Skyted',
  },
  sheet: {
    lede: {
      fr: 'L’application compagnon du casque Skyted 320 : elle gère l’appareil, entraîne à parler bas, et affiche jusqu’où la voix porte réellement.',
      en: draft(
        'The companion application of the Skyted 320 headset: it manages the device, trains to speak low, and shows how far the voice really carries.',
      ),
    },
    links: [
      {
        label: 'skyted.io',
        href: 'https://www.skyted.io/',
      },
    ],
    chapters: [
      {
        paragraphs: [
          {
            fr: 'Un casque qui promet des appels discrets ne suffit pas : encore faut-il que la personne sache à quel volume parler. Sans retour, on surestime ou on sous-estime sa propre voix, et la promesse de confidentialité ne tient plus.',
            en: draft(
              'A headset that promises discreet calls is not enough: the person still has to know how loud to speak. Without feedback, one over- or underestimates one’s own voice, and the promise of privacy no longer holds.',
            ),
          },
          {
            fr: 'L’application analyse simultanément la voix et le bruit ambiant, puis affiche deux distances : celle à partir de laquelle une personne proche pourrait comprendre, et celle à partir de laquelle la voix pourrait devenir gênante.',
            en: draft(
              'The application analyses the voice and the ambient noise at once, then shows two distances: the one from which someone nearby could understand, and the one from which the voice could become a nuisance.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'J’ai repris l’application après le départ du développeur précédent. Prendre en main une base que je n’avais pas écrite, la faire tenir, puis y ajouter des fonctionnalités et livrer plusieurs versions en production.',
            en: draft(
              'I took the application over after the previous developer left. Getting to grips with a code base I had not written, keeping it standing, then adding features and shipping several releases to production.',
            ),
          },
          {
            fr: 'Elle est développée en natif : Swift côté iOS, Kotlin côté Android.',
            en: draft('It is built natively: Swift on iOS, Kotlin on Android.'),
          },
        ],
        bullets: [
          {
            term: { fr: 'appairage', en: draft('pairing') },
            text: {
              fr: 'enregistrement de l’appareil et mises à jour du micrologiciel',
              en: draft('device registration and firmware updates'),
            },
          },
          {
            term: { fr: 'état', en: draft('status') },
            text: {
              fr: 'niveau de batterie, compte utilisateur',
              en: draft('battery level, user account'),
            },
          },
          {
            term: { fr: 'mesure', en: draft('measure') },
            text: {
              fr: 'distances d’intelligibilité et de gêne, en temps réel',
              en: draft('intelligibility and nuisance distances, in real time'),
            },
          },
          {
            term: { fr: 'apprentissage', en: draft('training') },
            text: {
              fr: 'entraînement à la voix basse, retour audio dans le casque',
              en: draft('whisper training, audio feedback in the headset'),
            },
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'L’application existait déjà, en Swift d’un côté et en Kotlin de l’autre. La tentation, en reprenant une base qu’on n’a pas écrite, est de la réécrire dans une technologie unique.',
            en: draft(
              'The application already existed, in Swift on one side and in Kotlin on the other. The temptation, taking over a code base one did not write, is to rewrite it in a single technology.',
            ),
          },
          {
            fr: 'Je ne l’ai pas fait. La liaison au matériel — appairage, micrologiciel, flux audio — passe par les API Bluetooth de chaque système ; une couche partagée les aurait recouvertes d’une abstraction de plus, sur un produit déjà en vente. Le coût assumé : tout s’écrit deux fois, et chaque livraison se fait deux fois.',
            en: draft(
              'I did not. The link to the hardware — pairing, firmware, audio stream — goes through each system’s Bluetooth APIs; a shared layer would have covered them with one more abstraction, on a product already on sale. The cost accepted: everything is written twice, and every release ships twice.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'Ce qui existe : une application publiée sur les deux magasins, liée à un produit matériel commercialisé, et des livraisons successives que j’ai assurées.',
            en: draft(
              'What exists: an application published on both stores, tied to a hardware product on the market, and successive releases that I delivered.',
            ),
          },
          {
            fr: 'Ce qui n’est pas démontré ici : la précision réelle des distances affichées, l’adoption, et la part du traitement qui relève du casque plutôt que de l’application.',
            en: draft(
              'What is not shown here: the real accuracy of the distances displayed, adoption, and how much of the processing belongs to the headset rather than to the application.',
            ),
          },
        ],
      },
    ],
  },
};
