// The one list of verified law anchors. Each id was found in the HTML of the law page on the check date.
// Add an anchor only after you find its id in the HTML of the law page and set CHECKED. This is a manual check (see Phase 5 in the exam upgrade plan).
export const CHECKED = '2026-10-24';
export const LAW_PATH = '/BWBR0004825/2026-07-01';
export const LAW = `https://wetten.overheid.nl${LAW_PATH}`;
// Article number -> anchor. A paragraph number in the anchor is not always the article number.
export const ARTICLES = {
  1: 'HoofdstukI_Artikel1', '2b': 'HoofdstukI_Artikel2b',
  3: 'HoofdstukII_Paragraaf1_Artikel3', 5: 'HoofdstukII_Paragraaf1_Artikel5', 6: 'HoofdstukII_Paragraaf1_Artikel6', 10: 'HoofdstukII_Paragraaf1_Artikel10',
  11: 'HoofdstukII_Paragraaf2_Artikel11', 12: 'HoofdstukII_Paragraaf2_Artikel12', 13: 'HoofdstukII_Paragraaf3_Artikel13', 14: 'HoofdstukII_Paragraaf4_Artikel14',
  15: 'HoofdstukII_Paragraaf5_Artikel15', '15a': 'HoofdstukII_Paragraaf5a_Artikel15a', 17: 'HoofdstukII_Paragraaf7_Artikel17', 18: 'HoofdstukII_Paragraaf7_Artikel18',
  19: 'HoofdstukII_Paragraaf8_Artikel19', 20: 'HoofdstukII_Paragraaf8_Artikel20', 21: 'HoofdstukII_Paragraaf8_Artikel21', 23: 'HoofdstukII_Paragraaf9_Artikel23',
  24: 'HoofdstukII_Paragraaf10_Artikel24', 28: 'HoofdstukII_Paragraaf12_Artikel28', 29: 'HoofdstukII_Paragraaf12_Artikel29', 42: 'HoofdstukII_Paragraaf16_Artikel42',
  43: 'HoofdstukII_Paragraaf16_Artikel43', 47: 'HoofdstukII_Paragraaf18_Artikel47', 48: 'HoofdstukII_Paragraaf18_Artikel48', 49: 'HoofdstukII_Paragraaf19_Artikel49',
  50: 'HoofdstukII_Paragraaf20_Artikel50', 52: 'HoofdstukII_Paragraaf22_Artikel52', 54: 'HoofdstukII_Paragraaf24_Artikel54', 55: 'HoofdstukII_Paragraaf24_Artikel55',
  56: 'HoofdstukII_Paragraaf24_Artikel56', 57: 'HoofdstukII_Paragraaf25_Artikel57', '61a': 'HoofdstukII_Paragraaf30_Artikel61a',
  62: 'HoofdstukIII_Paragraaf1_Artikel62', 63: 'HoofdstukIII_Paragraaf1_Artikel63', 64: 'HoofdstukIII_Paragraaf1_Artikel64',
  68: 'HoofdstukIII_Paragraaf3_Artikel68', 69: 'HoofdstukIII_Paragraaf3_Artikel69', 70: 'HoofdstukIII_Paragraaf3_Artikel70', 71: 'HoofdstukIII_Paragraaf3_Artikel71',
  73: 'HoofdstukIII_Paragraaf3_Artikel73', 74: 'HoofdstukIII_Paragraaf3_Artikel74', 75: 'HoofdstukIII_Paragraaf3_Artikel75',
  76: 'HoofdstukIII_Paragraaf4_Artikel76', 77: 'HoofdstukIII_Paragraaf4_Artikel77', 78: 'HoofdstukIII_Paragraaf4_Artikel78', 79: 'HoofdstukIII_Paragraaf4_Artikel79',
  80: 'HoofdstukIII_Paragraaf4_Artikel80', 81: 'HoofdstukIII_Paragraaf4_Artikel81',
  82: 'HoofdstukIV_Paragraaf1_Artikel82', 83: 'HoofdstukIV_Paragraaf1_Artikel83', 84: 'HoofdstukIV_Paragraaf2_Artikel84', 91: 'HoofdstukVI_Paragraaf5_Artikel91',
  32: 'HoofdstukII_Paragraaf13_Artikel32', 34: 'HoofdstukII_Paragraaf13_Artikel34', 58: 'HoofdstukII_Paragraaf26_Artikel58', 59: 'HoofdstukII_Paragraaf27_Artikel59',
};
// Regeling voertuigen (BWBR0025798): article number -> anchor. Checked in the HTML of the law page on the check date.
export const REGV_PATH = '/BWBR0025798/2026-07-01';
export const REGV = {
  '1.1': 'Hoofdstuk1_Afdeling1_Artikel1.1', '5.2.27': 'Hoofdstuk5_Afdeling2_Paragraaf6_Artikel5.2.27', '5.2.31': 'Hoofdstuk5_Afdeling2_Paragraaf8_Artikel5.2.31',
  '5.2.47': 'Hoofdstuk5_Afdeling2_Paragraaf9_Artikel5.2.47', '5.18.2': 'Hoofdstuk5_Afdeling18_Paragraaf0_Artikel5.18.2', '5.18.4': 'Hoofdstuk5_Afdeling18_Paragraaf0_Artikel5.18.4',
  '5.18.6': 'Hoofdstuk5_Afdeling18_Paragraaf0_Artikel5.18.6', '5.18.38': 'Hoofdstuk5_Afdeling18_Paragraaf4_Sub-paragraafB_Artikel5.18.38',
};
// Other laws: a dated path and the anchors checked in that law.
export const OTHER_LAWS = { '/BWBR0006622/2026-09-01': ['HoofdstukII_Paragraaf1_Artikel5', 'HoofdstukII_Paragraaf1_Artikel7'], [REGV_PATH]: Object.values(REGV) };
export const ANNEX_LETTERS = 'ABCDEFGHJKL'.split('');
export const ANCHORS = [...Object.values(ARTICLES), 'Bijlage1', ...ANNEX_LETTERS.map(letter => `Bijlage1_DivisieHoofdstuk${letter}`)];
