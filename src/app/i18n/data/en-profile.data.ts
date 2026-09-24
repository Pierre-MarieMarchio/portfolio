import { draft } from '@app/core/rules';
import { ProfileTexts } from '@app/features/profile/ports';

export const EN_PROFILE: ProfileTexts = {
  about: {
    heading: draft('About'),
    label: draft('About'),
    parts: draft('Sections'),
    title: draft((part: string) => `About: ${part}`),
    goTo: draft((part: string) => `Go to ${part}`),
    next: draft((part: string) => `Next: ${part} →`),
    back: draft('See the projects →'),
    profile: {
      label: draft('Profile'),
      title: draft('Profile'),
      lead: draft(
        'I wrote my first lines of code modding Skyrim and Crusader Kings.',
      ),
      facts: [
        {
          term: draft('Position'),
          value: draft('Work-study developer at Skyted, since October 2025'),
          tone: 'text',
        },
        {
          term: draft('Training'),
          value: draft(
            'Application designer and developer (bachelor level), Simplon, until April 2027',
          ),
          tone: 'text',
        },
        {
          term: draft('Rhythm'),
          value: draft('3 weeks at work, 1 week of training'),
          tone: 'text',
        },
        {
          term: draft('Location'),
          value: draft('Toulouse, or remote'),
          tone: 'text',
        },
        {
          term: draft('Languages'),
          value: draft('Bilingual French and English'),
          tone: 'text',
        },
      ],
      prose: [
        draft(
          'There was always a PC at home, and I wanted to know what was inside it. But I am curious about everything, and it took me a while to choose. I was an archaeologist first, five years on excavation sites. A fine job, but not one that pays the bills. All that time, I kept on modding.',
        ),
        draft(
          'In 2021, I chose software development. I am now a work-study developer at Skyted, where I do a bit of everything: Angular front ends, .NET APIs, desktop and mobile apps talking to a headset over Bluetooth. My curiosity gets its fill there. To avoid spreading myself thin, I run almost everything through .NET and Angular, down to an Android app written in C#.',
        ),
        draft(
          'What interests me most is design: how to split code so that it can still be changed two years later. It is also where I have the most to learn.',
        ),
      ],
    },
    skills: {
      label: draft('Skills'),
      title: draft('Skills'),
      heading: draft('What I work with'),
      domains: [
        {
          label: 'Web',
          value: draft('Angular (signals, SSR, i18n), TypeScript, SCSS'),
        },
        {
          label: draft('Back end'),
          value: 'C#, .NET 10, ASP.NET Core, EF Core, PostgreSQL, Firebase',
        },
        {
          label: 'Desktop',
          value: draft('Avalonia, on Windows, macOS and Linux'),
        },
        {
          label: 'Mobile',
          value: 'Kotlin Multiplatform, Swift, Avalonia',
        },
        {
          label: draft('Bluetooth and audio'),
          value: draft('Bluetooth Classic and BLE, real-time audio'),
        },
        {
          label: draft('Architecture'),
          value: draft('Clean Architecture, DDD, CQRS, architecture tests'),
        },
        {
          label: draft('Deployment'),
          value: draft('GitHub Actions, Docker, OVHcloud VPS'),
        },
      ],
      prose: draft(
        'I work in C# and Angular every day, with Avalonia for desktop. I have also shipped Kotlin at work. Java, Swift and React I have worked with less closely.',
      ),
    },
    method: {
      label: draft('What next'),
      title: draft('What next'),
      heading: draft('What I am looking for'),
      steps: [
        draft('A work-study position to finish my degree, until April 2027.'),
        draft(
          'Then a master’s-level work-study programme, towards software architecture.',
        ),
        draft(
          'A team where someone reviews my code. I learned a lot working alone, but I have got what I can out of it.',
        ),
        draft(
          'I am also open to a permanent job or freelance work, depending on the project.',
        ),
      ],
      contact: draft('To talk about it, write to me at'),
    },
    path: {
      label: draft('Path'),
      title: draft('Path'),
      heading: draft('Milestones'),
      milestones: [
        {
          year: '2025 –',
          fact: draft(
            'Work-study at Skyted, application designer and developer degree',
          ),
        },
        {
          year: '2025',
          fact: draft(
            'Open-source projects: ngx-statewise and a .NET API template',
          ),
        },
        {
          year: '2024',
          fact: draft(
            'Internship at Numerilis, Paris: reworking the Bk-ONE Java application',
          ),
        },
        {
          year: '2024',
          fact: draft(
            'Web and mobile web developer diploma, AFPA, with the jury’s congratulations',
          ),
        },
        { year: '2023', fact: draft('Apple Foundation Program, Simplon') },
        { year: '2021 – 2023', fact: draft('Teaching myself to code') },
        {
          year: '2020',
          fact: draft('Bachelor’s degree in archaeology, Toulouse'),
        },
        {
          year: '2016 – 2021',
          fact: draft('Archaeologist on excavation sites'),
        },
      ],
    },
  },
  contact: {
    email: draft('Write to me at pierremariemarchio.pro@gmail.com'),
    linkedin: draft('LinkedIn profile of Pierre-Marie Marchio'),
    github: draft('GitHub repositories of Pierre-Marie Marchio'),
    cv: draft('Open my CV as a PDF'),
  },
};
