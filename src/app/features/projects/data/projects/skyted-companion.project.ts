import { draft } from '@app/core/i18n';
import { ProjectEntry } from '../../models';

/** Skyted Companion: identity, facts and sheet, in one place. */
export const SKYTED_COMPANION: ProjectEntry = {
  project: {
    slug: 'skyted-companion',
    title: 'Skyted Companion',
    short: 'Skyted Companion',
    tag: { fr: 'interne', en: draft('internal') },
    family: 'professional',
    subject: {
      fr: 'Application compagnon utilisée en interne autour du casque : appairage, mise à jour du micrologiciel et vérification de l’état de l’appareil.',
      en: draft(
        'A companion application used internally around the headset: pairing, firmware updates and checking the device’s status.',
      ),
    },
    summary: {
      fr: 'compagnon matériel, usage interne',
      en: draft('hardware companion, internal use'),
    },
  },
  facts: {
    proof: {
      fr: 'Interne · non publiée',
      en: draft('Internal · not published'),
    },
    proofLevel: 'none',
    role: {
      fr: 'Développement, en équipe',
      en: draft('Development, in a team'),
    },
    stack: { fr: 'Natif · BLE', en: draft('Native · BLE') },
    context: 'Skyted',
  },
  sheet: {
    lede: {
      fr: 'L’application compagnon utilisée en interne autour du casque : elle sert à préparer l’appareil, le mettre à jour et vérifier son état.',
      en: draft(
        'The companion application used internally around the headset: it serves to prepare the device, update it and check its status.',
      ),
    },
    links: [],
    chapters: [
      {
        paragraphs: [
          {
            fr: 'Un casque connecté ne se suffit pas à lui-même : il faut pouvoir l’appairer, le mettre à jour, vérifier son état et reproduire un problème signalé. Ce travail n’a pas sa place dans l’application grand public, qui doit rester simple.',
            en: draft(
              'A connected headset is not enough on its own: it has to be paired, updated, its status checked and a reported problem reproduced. That work has no place in the consumer application, which must stay simple.',
            ),
          },
          {
            fr: 'C’est le rôle de cette application compagnon : donner accès à l’appareil de près, pour les personnes qui travaillent avec lui.',
            en: draft(
              'That is the role of this companion application: giving close access to the device, for the people who work with it.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'J’ai développé des fonctionnalités de cette application au sein de l’équipe mobile, sur les deux plateformes, et suivi la liaison Bluetooth avec l’appareil.',
            en: draft(
              'I developed features of this application within the mobile team, on both platforms, and followed the Bluetooth link with the device.',
            ),
          },
          {
            fr: 'Elle partage son terrain avec l’application publique — mêmes protocoles, même matériel — mais son public est interne, avec des libertés qu’un magasin n’autoriserait pas.',
            en: draft(
              'It shares its ground with the public application — the same protocols, the same hardware — but its audience is internal, with freedoms a store would not allow.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'La question était de savoir jusqu’où exposer l’appareil. Tout montrer rend l’outil puissant et illisible ; ne rien montrer le rend inutile.',
            en: draft(
              'The question was how far to expose the device. Showing everything makes the tool powerful and unreadable; showing nothing makes it useless.',
            ),
          },
          {
            fr: 'J’ai gardé une interface aussi proche que possible de celle de l’application publique, et laissé le reste à l’outillage. Le compromis : certaines opérations demandent encore de passer par un outil séparé.',
            en: draft(
              'I kept an interface as close as possible to the public application’s, and left the rest to the tooling. The trade-off: some operations still require going through a separate tool.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'Ce qui existe : une application en service en interne, liée au même matériel que l’application publiée.',
            en: draft(
              'What exists: an application in service internally, tied to the same hardware as the published application.',
            ),
          },
          {
            fr: 'Ce qui ne peut pas être montré ici : elle n’est pas téléchargeable, et son contenu appartient à l’entreprise. La preuve, dans ce cas, est un récit précis plutôt qu’un lien.',
            en: draft(
              'What cannot be shown here: it cannot be downloaded, and its content belongs to the company. The proof, in this case, is a precise account rather than a link.',
            ),
          },
        ],
      },
    ],
  },
};
