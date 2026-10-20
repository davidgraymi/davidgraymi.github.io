/**
 * Preset puzzles. Maps are 10 x 7: `#` is a wall, `.` is floor. Robots are
 * [startRow, startCol, goalRow, goalCol].
 */
export interface Preset {
  id: string;
  name: string;
  blurb: string;
  map: string[];
  robots: [number, number, number, number][];
}

export const WIDTH = 10;
export const HEIGHT = 7;
export const MAX_ROBOTS = 6;

export const PRESETS: Preset[] = [
  {
    id: 'doorway',
    name: 'Doorway',
    blurb: 'Two robots, one gap in the wall. Someone has to wait.',
    map: [
      '....#.....',
      '....#.....',
      '....#.....',
      '..........',
      '....#.....',
      '....#.....',
      '....#.....',
    ],
    robots: [
      [2, 1, 4, 8],
      [4, 8, 2, 1],
    ],
  },
  {
    id: 'passing-bay',
    name: 'Passing bay',
    blurb: 'A one-lane corridor with a single pocket. Swap the ends.',
    map: [
      '##########',
      '##########',
      '####.#####',
      '#........#',
      '##########',
      '##########',
      '##########',
    ],
    robots: [
      [3, 1, 3, 8],
      [3, 8, 3, 1],
    ],
  },
  {
    id: 'crossroads',
    name: 'Crossroads',
    blurb: 'Four robots, one junction, everyone heading for the far arm.',
    map: [
      '####..####',
      '####..####',
      '..........',
      '..........',
      '####..####',
      '####..####',
      '####..####',
    ],
    robots: [
      [0, 4, 6, 5],
      [6, 5, 0, 4],
      [2, 0, 3, 9],
      [3, 9, 2, 0],
    ],
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    blurb: 'Six robots threading between shelving.',
    map: [
      '..........',
      '.##.##.##.',
      '..........',
      '.##.##.##.',
      '..........',
      '.##.##.##.',
      '..........',
    ],
    robots: [
      [0, 0, 6, 9],
      [6, 9, 0, 0],
      [0, 9, 6, 0],
      [6, 0, 0, 9],
      [2, 3, 4, 6],
      [4, 6, 2, 3],
    ],
  },
];
