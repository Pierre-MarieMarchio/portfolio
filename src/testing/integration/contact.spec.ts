import { EN_PROFILE } from '@app/i18n/data/en-profile.data';
import { FR_PROFILE } from '@app/i18n/data/fr-profile.data';
import { CONTACT_ADDRESSES, CONTACT_EMAIL } from '@app/features/profile/data';

describe('contact addresses', () => {
  it('writes the email once, and derives the mail link from it', () => {
    const email = CONTACT_ADDRESSES.find((address) => address.icon === 'email');
    expect(email?.href).toBe(`mailto:${CONTACT_EMAIL}`);
  });

  it('offers the CV as a PDF served next to the site, in a new tab', () => {
    const cv = CONTACT_ADDRESSES.find((address) => address.icon === 'cv');
    expect(cv?.href).toMatch(/^[^/:]+\.pdf$/);
    expect(cv?.external).toBe(true);
  });

  it('names every address in both languages', () => {
    for (const address of CONTACT_ADDRESSES) {
      expect(FR_PROFILE.contact[address.icon]).toBeTruthy();
      expect(EN_PROFILE.contact[address.icon]).toBeTruthy();
    }
  });

  it('titles every address in both languages', () => {
    for (const address of CONTACT_ADDRESSES) {
      expect(FR_PROFILE.contactTitle[address.icon]).toBeTruthy();
      expect(EN_PROFILE.contactTitle[address.icon]).toBeTruthy();
    }
  });
});
