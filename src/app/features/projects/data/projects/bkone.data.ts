import { draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

/** Bk-ONE: identity, facts and detail, in one place. */
export const BKONE: ProjectEntry = {
  project: {
    slug: 'bkone',
    title: 'Bk-ONE',
    short: 'Bk-ONE',
    tag: { fr: 'bancaire', en: draft('banking') },
    family: 'professional',
    subject: {
      fr: 'Module de la gamme bancaire BKLINK, destiné aux banques de la zone euro : réception et émission de flux d’opérations STP, mise en œuvre des conventions EPC, virements CREDEURO et ICP, interface d’administration et interfaçage avec des applications externes.',
      en: draft(
        'A module of the BKLINK banking range, for banks of the euro area: receiving and sending STP transaction flows, implementing the EPC conventions, CREDEURO and ICP transfers, an administration interface and interfacing with external applications.',
      ),
    },
    summary: {
      fr: 'compensation bancaire, zone euro',
      en: draft('bank clearing, euro area'),
    },
  },
  facts: {
    proof: {
      fr: 'Produit commercialisé · code privé',
      en: draft('Product on the market · private code'),
    },
    proofLevel: 'indirect',
    role: {
      fr: 'Stage — refonte du back',
      en: draft('Internship — back-end rework'),
    },
    stack: { fr: 'Java · flux ISO 20022', en: draft('Java · ISO 20022 flows') },
    context: 'Numerilis',
  },
  detail: {
    lede: {
      fr: 'Un progiciel bancaire de la gamme BKLINK : il ouvre la compensation européenne aux banques sous-compensées.',
      en: draft(
        'A banking software package of the BKLINK range: it opens European clearing to indirectly cleared banks.',
      ),
    },
    links: [
      {
        label: {
          fr: 'bklink.com — présentation du produit',
          en: draft('bklink.com — product presentation'),
        },
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
          {
            fr: 'Une banque sous-compensée ne présente pas directement ses opérations à la compensation : elle passe par un établissement tiers. Bk-ONE lui ouvre la compensation européenne en gérant elle-même ses flux, dans les formats et selon les règles imposés par le secteur.',
            en: draft(
              'An indirectly cleared bank does not present its transactions to clearing itself: it goes through a third party. Bk-ONE opens European clearing to it by handling its own flows, in the formats and under the rules the sector imposes.',
            ),
          },
          {
            fr: 'C’est un domaine où l’exactitude prime sur tout le reste : un virement mal formé n’est pas un défaut d’affichage, c’est une opération rejetée.',
            en: draft(
              'It is a field where accuracy comes before anything else: a malformed transfer is not a display glitch, it is a rejected transaction.',
            ),
          },
        ],
        bullets: [
          {
            term: { fr: 'flux STP', en: draft('STP flows') },
            text: {
              fr: 'réception et émission d’opérations de bout en bout',
              en: draft('receiving and sending transactions end to end'),
            },
          },
          {
            term: { fr: 'conventions EPC', en: draft('EPC conventions') },
            text: {
              fr: 'application des règles européennes de paiement',
              en: draft('applying the European payment rules'),
            },
          },
          {
            term: { fr: 'virements', en: draft('transfers') },
            text: {
              fr: 'types CREDEURO et ICP',
              en: draft('CREDEURO and ICP types'),
            },
          },
          {
            term: { fr: 'administration', en: draft('administration') },
            text: {
              fr: 'interface complète et interfaçage avec des applications externes',
              en: draft(
                'a complete interface and interfacing with external applications',
              ),
            },
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'J’y étais stagiaire, sur la refonte du code back. Mon travail ne s’est pas limité à exécuter : j’ai proposé des éléments de solution pour l’architecture, et une partie a été retenue.',
            en: draft(
              'I was an intern there, on the rework of the back-end code. My work did not stop at carrying out tasks: I proposed parts of the solution for the architecture, and some of it was kept.',
            ),
          },
          {
            fr: 'C’est là que j’ai pris goût au découpage en couches et aux règles qu’une base de code se donne à elle-même — ce que je reprends aujourd’hui dans mon socle .NET personnel.',
            en: draft(
              'That is where I took to layering and to the rules a code base sets itself — what I take up today in my personal .NET foundation.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'Un message d’opération mal formé n’est pas un défaut d’affichage : c’est une opération rejetée. La question posée pendant la refonte était de savoir où cette forme devait être vérifiée.',
            en: draft(
              'A malformed transaction message is not a display glitch: it is a rejected transaction. The question during the rework was where that shape should be checked.',
            ),
          },
          {
            fr: 'L’élément que j’ai proposé, et qui a été retenu en partie, tient la vérification à la frontière plutôt que dans les traitements : un message est validé une fois, à l’entrée, et le métier travaille ensuite sur des données dont la forme est acquise. Le coût est un modèle de plus à maintenir à côté du format bancaire.',
            en: draft(
              'The part I proposed, and which was partly kept, holds the check at the boundary rather than in the processing: a message is validated once, on the way in, and the business logic then works on data whose shape is settled. The cost is one more model to maintain beside the banking format.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'Ce qui existe : un produit commercialisé, documenté publiquement par son éditeur.',
            en: draft(
              'What exists: a product on the market, documented publicly by its publisher.',
            ),
          },
          {
            fr: 'Ce qui n’est pas démontrable ici : le code est privé, et le détail des traitements bancaires ne peut pas être exposé. La preuve, dans ce cas, sera un récit précis plutôt qu’un dépôt.',
            en: draft(
              'What cannot be shown here: the code is private, and the detail of the banking processing cannot be exposed. The proof, in this case, will be a precise account rather than a repository.',
            ),
          },
        ],
      },
    ],
  },
};
