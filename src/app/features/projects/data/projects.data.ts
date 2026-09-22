import { Project } from '../models';

/**
 * The projects, in rank order: the order is the distance from the centre in
 * the mockup, and the reading order everywhere else. Filtering never reorders.
 * The first four are the featured ones.
 *
 * Content, not data: it ships with the site. Only the repository reads it,
 * so a remote source can replace this file without any other one noticing.
 * Copied from the export, text for text.
 */
export const PROJECTS: readonly Project[] = [
  {
    slug: 'skyted-voice',
    title: 'Skyted Voice',
    short: 'Skyted Voice',
    tag: 'publié',
    family: 'professional',
    subject:
      'Application mobile d’amplification vocale : elle se connecte à un casque Bluetooth, capte la voix en temps réel et l’élève à un niveau que l’entourage peut suivre.',
    summary: 'amplification vocale, iOS et Android',
  },
  {
    slug: 'skyted-app',
    title: 'Skyted App',
    short: 'Skyted App',
    tag: 'publié',
    family: 'professional',
    subject:
      'L’application de gestion du casque Skyted 320 : appairage et enregistrement de l’appareil, niveau de batterie, compte utilisateur, module d’entraînement à la voix basse, boucle de retour audio, et affichage en temps réel de la distance à laquelle la voix reste perceptible.',
    summary: 'compagnon du casque 320',
  },
  {
    slug: 'ngx-statewise',
    title: 'ngx-statewise',
    short: 'ngx-statewise',
    tag: 'open source',
    family: 'personal',
    subject:
      'Une bibliothèque de gestion d’état pour Angular construite sur les signals : chaque action est reliée à la mise à jour d’état qu’elle provoque, puis aux effets qui en découlent.',
    summary: 'gestion d’état Angular',
  },
  {
    slug: 'template-dotnet',
    title: 'Template Clean Architecture .NET',
    short: 'Template .NET',
    tag: 'open source',
    family: 'personal',
    subject:
      'Un point de départ pour une API HTTP .NET 10 : découpage Clean Architecture, PostgreSQL via EF Core, authentification ASP.NET Identity avec JWT et jetons de rafraîchissement rotatifs, refus par défaut en autorisation, erreurs RFC 7807.',
    summary: 'socle d’API .NET 10',
  },
  {
    slug: 'bkone',
    title: 'Bk-ONE',
    short: 'Bk-ONE',
    tag: 'bancaire',
    family: 'professional',
    subject:
      'Module de la gamme bancaire BKLINK, destiné aux banques de la zone euro : réception et émission de flux d’opérations STP, mise en œuvre des conventions EPC, virements CREDEURO et ICP, interface d’administration et interfaçage avec des applications externes.',
    summary: 'compensation bancaire, zone euro',
  },
  {
    slug: 'skyted-companion',
    title: 'Skyted Companion',
    short: 'Skyted Companion',
    tag: 'interne',
    family: 'professional',
    subject:
      'Application compagnon utilisée en interne autour du casque : appairage, mise à jour du micrologiciel et vérification de l’état de l’appareil.',
    summary: 'compagnon matériel, usage interne',
  },
  {
    slug: 'speakey',
    title: 'Speakey',
    short: 'Speakey',
    tag: 'prototype',
    family: 'personal',
    subject:
      'Prototype mobile personnel, écrit pour apprendre et resté à l’état de prototype.',
    summary: 'prototype personnel',
  },
];
