/**
 * Correspondance entre la valeur d'un dé et l'orientation qui la présente
 * vers le haut. Isolé du composant pour rester vérifiable : un dé qui
 * n'affiche pas le chiffre tiré est un bug silencieux.
 */

/** Ordre des matériaux d'une BoxGeometry : +x, -x, +y, -y, +z, -z. */
export const FACE_ORDER = [1, 6, 2, 5, 3, 4] as const;

/** Rotation amenant la valeur demandée face au ciel. */
export const restFor = (value: number): [number, number, number] => {
  switch (value) {
    case 1:
      return [0, 0, Math.PI / 2];
    case 6:
      return [0, 0, -Math.PI / 2];
    case 2:
      return [0, 0, 0];
    case 5:
      return [Math.PI, 0, 0];
    case 3:
      return [-Math.PI / 2, 0, 0];
    default:
      return [Math.PI / 2, 0, 0];
  }
};
