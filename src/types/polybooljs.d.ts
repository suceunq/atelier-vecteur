/** polybooljs ships no types - minimal ambient declaration for the subset of its API this app uses. */
declare module "polybooljs" {
  export interface Polygon {
    regions: number[][][];
    inverted: boolean;
  }

  const PolyBool: {
    union(poly1: Polygon, poly2: Polygon): Polygon;
    intersect(poly1: Polygon, poly2: Polygon): Polygon;
    difference(poly1: Polygon, poly2: Polygon): Polygon;
    differenceRev(poly1: Polygon, poly2: Polygon): Polygon;
    xor(poly1: Polygon, poly2: Polygon): Polygon;
  };

  export default PolyBool;
}
