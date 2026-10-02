import { bilingual, draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

export const BKONE: ProjectEntry = {
  project: {
    slug: 'bkone',
    title: 'Bk-ONE',
    short: 'Bk-ONE',
    tag: bilingual('stage', draft('internship')),
    family: 'professional',
    subject: bilingual(
      'Un progiciel bancaire de la gamme BKLINK, pour les banques de la zone euro. J’ai participé à la refonte de son application Java.',
      draft(
        'A banking software package from the BKLINK range, for euro-area banks. I took part in reworking its Java application.',
      ),
    ),
    summary: bilingual(
      'progiciel bancaire, Java',
      draft('banking software, Java'),
    ),
  },
  facts: {
    proof: bilingual(
      'Vendu à des banques · code privé',
      draft('Sold to banks · private code'),
    ),
    role: bilingual('Stagiaire, refonte du code', draft('Intern, code rework')),
    stack: 'Java · Swing · XML',
    context: 'Numerilis',
    period: '2024',
  },
  detail: {
    lede: bilingual(
      'Une application Swing ancienne, sans framework, qui gère des flux de virements.',
      draft(
        'An old Swing application, with no framework, that handles transfer flows.',
      ),
    ),
    links: [
      {
        label: bilingual(
          'bklink.com, la page du produit',
          draft('bklink.com, the product page'),
        ),
        href: 'https://www.bklink.com/produits/bklink/bk-one/',
      },
      {
        label: 'numerilis.com',
        href: 'https://www.numerilis.com/',
      },
    ],
    chapters: [
      {
        paragraphs: [
          bilingual(
            'Bk-ONE traite des flux d’opérations bancaires en réception et en émission, selon les règles européennes de paiement (conventions EPC, virements CREDEURO et ICP).',
            draft(
              'Bk-ONE handles incoming and outgoing flows of banking operations, under the European payment rules (EPC conventions, CREDEURO and ICP transfers).',
            ),
          ),
        ],
      },
      {
        paragraphs: [
          bilingual(
            'La refonte de l’interface : sortir les responsabilités dans des classes à part, supprimer le code dupliqué d’un écran à l’autre, mutualiser les composants. J’ai aussi centralisé et automatisé le traitement des flux XML, avec des contrôles d’intégrité sur des données bancaires personnelles.',
            draft(
              'Reworking the interface: moving responsibilities into their own classes, removing code duplicated from one screen to the next, sharing the components. I also centralised and automated the XML flow processing, with integrity checks on personal banking data.',
            ),
          ),
        ],
      },
      {
        title: bilingual(
          'Une proposition retenue',
          draft('A proposal that was kept'),
        ),
        paragraphs: [
          bilingual(
            'Le code chargeait chaque fichier XML en entier dans une chaîne de caractères, puis allait lire et modifier chaque partie directement dans cette chaîne. J’ai proposé de passer par des objets : on lit le fichier une fois, puis on modifie des objets avec leurs méthodes. Rien de révolutionnaire sur le papier, mais il a fallu reprendre une bonne partie du code, et le traitement est devenu nettement plus robuste.',
            draft(
              'The code loaded each XML file whole into a string, then read and edited each part directly in that string. I proposed going through objects: read the file once, then change objects through their methods. Nothing revolutionary on paper, but a good part of the code had to be reworked, and the processing became much more robust.',
            ),
          ),
        ],
      },
    ],
  },
};
