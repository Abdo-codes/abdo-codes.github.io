// Exam screen terms as pairs [nl, en]. Most terms come from the CBR sample screen (Preview Kandidaat, undated).
// Some labels (Gemarkeerd, Ja, Nee, Uitslag, Theorie-examen) are our own wording. The current CBR screen may differ.
export const LABELS = {
  question: ['Vraag', 'Question'], of: ['van', 'of'], time: ['Resterende tijd', 'Time left'], mark: ['Markeren', 'Mark'], marked: ['Gemarkeerd', 'Marked'],
  overview: ['Overzicht', 'Overview'], previous: ['Vorige', 'Previous'], next: ['Volgende', 'Next'], help: ['Help', 'Help'],
  result: ['Uitslag', 'Result'], exam: ['Theorie-examen', 'Theory exam'], yes: ['Ja', 'Yes'], no: ['Nee', 'No'],
};
// Returns the label in the chosen language. Dutch off gives English only.
export const label = (key, dutch = true) => LABELS[key][dutch ? 0 : 1];
