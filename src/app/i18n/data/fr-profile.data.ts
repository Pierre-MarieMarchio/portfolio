import { ProfileTexts } from '@app/features/profile/ports';

export const FR_PROFILE: ProfileTexts = {
  about: {
    heading: 'À propos',
    label: 'À propos',
    parts: 'Rubriques',
    title: (part) => `À propos : ${part}`,
    goTo: (part) => `Aller à la rubrique ${part}`,
    next: (part) => `Suite : ${part} →`,
    back: 'Voir les projets →',
    profile: {
      label: 'Profil',
      title: 'Profil',
      lead: 'Mes premières lignes de code, je les ai écrites pour modder Skyrim et Crusader Kings.',
      facts: [
        {
          term: 'Poste',
          value: 'Développeur en alternance chez Skyted, depuis octobre 2025',
          tone: 'text',
        },
        {
          term: 'Formation',
          value:
            'Concepteur développeur d’applications (bac+3), Simplon, jusqu’en avril 2027',
          tone: 'text',
        },
        {
          term: 'Rythme',
          value: '3 semaines en entreprise, 1 semaine en formation',
          tone: 'text',
        },
        {
          term: 'Lieu',
          value: 'Toulouse, ou en télétravail',
          tone: 'text',
        },
        {
          term: 'Langues',
          value: 'Bilingue français-anglais',
          tone: 'text',
        },
      ],
      prose: [
        'Il y a toujours eu un PC à la maison, et je voulais savoir ce qu’il y avait dedans. Mais je suis curieux de tout, et j’ai mis du temps à choisir. J’ai d’abord été archéologue, cinq ans sur des chantiers de fouilles. Un beau métier, qui nourrit mal son homme. Pendant tout ce temps, je n’ai pas arrêté les mods.',
        'En 2021, j’ai choisi le développement. Je suis aujourd’hui en alternance chez Skyted, où je touche à tout : front Angular, API .NET, applications desktop et mobiles reliées en Bluetooth à un casque. Ma curiosité y trouve son compte. Pour ne pas m’éparpiller, je fais passer presque tout par .NET et Angular, jusqu’à une application Android écrite en C#.',
        'Ce qui m’intéresse le plus, c’est la conception, la façon de découper un code pour qu’on puisse encore le faire évoluer dans deux ans. C’est aussi là que j’ai le plus à apprendre.',
        'En dehors du code, il y a l’espace. Le décor de ce site vient de là.',
      ],
    },
    skills: {
      label: 'Compétences',
      title: 'Compétences',
      heading: 'Ce que je pratique',
      domains: [
        {
          label: 'Web',
          value: 'Angular (signals, SSR, i18n), TypeScript, SCSS',
        },
        {
          label: 'Back',
          value: 'C#, .NET 10, ASP.NET Core, EF Core, PostgreSQL, Firebase',
        },
        { label: 'Desktop', value: 'Avalonia, sur Windows, macOS et Linux' },
        {
          label: 'Mobile',
          value:
            'Android en Kotlin et Kotlin Multiplatform, iOS en Swift, Avalonia Android',
        },
        {
          label: 'Bluetooth et audio',
          value: 'Bluetooth Classic et BLE, audio temps réel',
        },
        {
          label: 'Architecture',
          value: 'Clean Architecture, DDD, CQRS, tests d’architecture',
        },
        {
          label: 'Outillage',
          value: 'Git, GitHub Actions, Docker, VPS OVHcloud',
        },
      ],
      prose:
        'Je travaille tous les jours en C# et en Angular, avec Avalonia pour le desktop. J’ai aussi livré du Kotlin en entreprise. Java, Swift et React, je les ai pratiqués de moins près.',
    },
    method: {
      label: 'Et après',
      title: 'Et après',
      heading: 'Ce que je cherche',
      steps: [
        'Une alternance pour terminer mon titre, jusqu’en avril 2027.',
        'Ensuite, un bac+5 en alternance, pour aller vers l’architecture logicielle.',
        'Une équipe où quelqu’un relit mon code. J’ai beaucoup appris en travaillant seul, mais j’ai fait le tour de ce que ça m’apporte.',
        'Je reste ouvert à un CDI ou à une mission freelance, selon le projet.',
      ],
      contact: 'Pour en parler, écrivez-moi à',
    },
    path: {
      label: 'Parcours',
      title: 'Parcours',
      heading: 'Étapes',
      milestones: [
        {
          year: '2025 –',
          fact: 'Alternance chez Skyted, titre Concepteur développeur d’applications',
        },
        {
          year: '2025',
          fact: 'Projets open source : ngx-statewise et un template d’API .NET',
        },
        {
          year: '2024',
          fact: 'Stage chez Numerilis, à Paris : refonte de l’application Java Bk-ONE',
        },
        {
          year: '2024',
          fact: 'Titre Développeur web et web mobile, AFPA, félicitations du jury',
        },
        { year: '2023', fact: 'Apple Foundation Program, Simplon' },
        { year: '2021 – 2023', fact: 'Autoformation au développement' },
        {
          year: '2020',
          fact: 'Licence d’archéologie, université Toulouse-Jean Jaurès',
        },
        {
          year: '2016 – 2021',
          fact: 'Archéologue sur des chantiers de fouilles',
        },
      ],
    },
  },
  contact: {
    email: 'M’écrire à pierremariemarchio.pro@gmail.com',
    linkedin: 'Profil LinkedIn de Pierre-Marie Marchio',
    github: 'Dépôts GitHub de Pierre-Marie Marchio',
    cv: 'Ouvrir mon CV en PDF',
  },
};
