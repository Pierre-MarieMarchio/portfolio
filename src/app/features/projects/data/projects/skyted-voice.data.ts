import { draft } from '@app/core/rules';
import { ProjectEntry } from '../../models';

export const SKYTED_VOICE: ProjectEntry = {
  project: {
    slug: 'skyted-voice',
    title: 'Skyted Voice',
    short: 'Skyted Voice',
    tag: { fr: 'publiée', en: draft('published') },
    family: 'professional',
    subject: {
      fr: 'Une application Android gratuite qui amplifie la voix, pour les personnes qui ont du mal à se faire entendre.',
      en: draft(
        'A free Android app that amplifies the voice, for people who struggle to be heard.',
      ),
    },
    summary: {
      fr: 'amplification de la voix, Android',
      en: draft('voice amplification, Android'),
    },
  },
  facts: {
    proof: { fr: 'Sur Google Play', en: draft('On Google Play') },
    proofLevel: 'public',
    role: {
      fr: 'Conception, développement et publication',
      en: draft('Design, development and release'),
    },
    stack: {
      fr: '.NET · Avalonia · audio temps réel',
      en: draft('.NET · Avalonia · real-time audio'),
    },
    context: 'Skyted',
  },
  detail: {
    lede: {
      fr: 'Pour ceux dont la voix porte mal, qu’elle soit fatiguée ou abîmée.',
      en: draft(
        'For people whose voice does not carry, whether tired or damaged.',
      ),
    },
    links: [
      {
        label: 'Google Play',
        href: 'https://play.google.com/store/apps/details?id=io.skyted.skytedvoice',
      },
      {
        label: {
          fr: 'Article de lancement sur skyted.io',
          en: draft('Launch article on skyted.io'),
        },
        href: 'https://www.skyted.io/fr/blog/skyted-voice-launches-on-android',
      },
    ],
    chapters: [
      {
        paragraphs: [
          {
            fr: 'On parle normalement dans le micro d’un casque Bluetooth, et le téléphone restitue la voix plus fort, par son haut-parleur ou une enceinte. Elle marche avec n’importe quel casque Bluetooth, et mieux avec le Skyted 320.',
            en: draft(
              'You speak normally into a Bluetooth headset’s microphone, and the phone plays your voice back louder, through its speaker or a Bluetooth speaker. It works with any Bluetooth headset, and best with the Skyted 320.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'La chaîne audio capte le micro du casque et renvoie le son en continu vers la sortie du téléphone, avec AudioRecord et AudioTrack. Une collègue a participé au développement, et j’ai assuré la publication sur Google Play.',
            en: draft(
              'The audio chain captures the headset’s microphone and streams the sound to the phone’s output, with AudioRecord and AudioTrack. A colleague took part in the development, and I handled the release on Google Play.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'Je l’avais d’abord écrite en .NET MAUI. Je l’ai passée en Avalonia, comme Companion, pour que les applications de Skyted partagent leur code au lieu d’utiliser chacune un framework différent. À terme, la refonte de l’application mobile, sur iOS et Android, doit pouvoir repartir de Companion.',
            en: draft(
              'I first wrote it in .NET MAUI. I moved it to Avalonia, like Companion, so that Skyted’s apps share their code instead of each using a different framework. Eventually, the rewrite of the mobile app, on iOS and Android, should be able to start from Companion.',
            ),
          },
        ],
      },
      {
        paragraphs: [
          {
            fr: 'Elle est sur Google Play depuis le 8 juin 2026.',
            en: draft('It has been on Google Play since 8 June 2026.'),
          },
        ],
      },
    ],
  },
};
