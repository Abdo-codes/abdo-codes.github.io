// A lane lesson has a `lane` object, the lane camera and the Merge button: kind 'merge' (chapter 05) or 'street' (chapter 07).
export const isLaneKind = mission => mission?.kind === 'merge' || mission?.kind === 'street';
