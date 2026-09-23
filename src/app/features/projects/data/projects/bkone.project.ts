import { ProjectEntry } from '../../models';

/** Bk-ONE: identity, facts and sheet, in one place. */
export const BKONE: ProjectEntry = {
  project: {
    slug: 'bkone',
    title: 'Bk-ONE',
    short: 'Bk-ONE',
    tag: 'bancaire',
    family: 'professional',
    subject:
      'Module de la gamme bancaire BKLINK, destiné aux banques de la zone euro : réception et émission de flux d’opérations STP, mise en œuvre des conventions EPC, virements CREDEURO et ICP, interface d’administration et interfaçage avec des applications externes.',
    summary: 'compensation bancaire, zone euro',
  },
  facts: {
    proof: 'Produit commercialisé · code privé',
    proofLevel: 'indirect',
    role: 'Stage — refonte du back',
    stack: 'Java · flux ISO 20022',
    context: 'Numerilis',
  },
  sheet: {
    lede: 'Un progiciel bancaire de la gamme BKLINK : il ouvre la compensation européenne aux banques sous-compensées.',
    links: [
      {
        label: 'bklink.com — présentation du produit',
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
          'Une banque sous-compensée ne présente pas directement ses opérations à la compensation : elle passe par un établissement tiers. Bk-ONE lui ouvre la compensation européenne en gérant elle-même ses flux, dans les formats et selon les règles imposés par le secteur.',
          'C’est un domaine où l’exactitude prime sur tout le reste : un virement mal formé n’est pas un défaut d’affichage, c’est une opération rejetée.',
        ],
        bullets: [
          {
            term: 'flux STP',
            text: 'réception et émission d’opérations de bout en bout',
          },
          {
            term: 'conventions EPC',
            text: 'application des règles européennes de paiement',
          },
          {
            term: 'virements',
            text: 'types CREDEURO et ICP',
          },
          {
            term: 'administration',
            text: 'interface complète et interfaçage avec des applications externes',
          },
        ],
      },
      {
        paragraphs: [
          'J’y étais stagiaire, sur la refonte du code back. Mon travail ne s’est pas limité à exécuter : j’ai proposé des éléments de solution pour l’architecture, et une partie a été retenue.',
          'C’est là que j’ai pris goût au découpage en couches et aux règles qu’une base de code se donne à elle-même — ce que je reprends aujourd’hui dans mon socle .NET personnel.',
        ],
      },
      {
        paragraphs: [
          'Un message d’opération mal formé n’est pas un défaut d’affichage : c’est une opération rejetée. La question posée pendant la refonte était de savoir où cette forme devait être vérifiée.',
          'L’élément que j’ai proposé, et qui a été retenu en partie, tient la vérification à la frontière plutôt que dans les traitements : un message est validé une fois, à l’entrée, et le métier travaille ensuite sur des données dont la forme est acquise. Le coût est un modèle de plus à maintenir à côté du format bancaire.',
        ],
      },
      {
        paragraphs: [
          'Ce qui existe : un produit commercialisé, documenté publiquement par son éditeur.',
          'Ce qui n’est pas démontrable ici : le code est privé, et le détail des traitements bancaires ne peut pas être exposé. La preuve, dans ce cas, sera un récit précis plutôt qu’un dépôt.',
        ],
      },
    ],
  },
};
