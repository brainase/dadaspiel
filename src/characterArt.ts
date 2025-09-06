import { Character } from './types';

// Палитра цветов для пиксель-арта.
// Каждая буква соответствует определенному цвету.
// Это позволяет "рисовать" персонажей с помощью текстовых строк.
export const PIXEL_ART_PALETTE = {
  // Оттенки кожи
  s: '#ffdbac', // Skin (Кожа)
  d: '#d4b39b', // Skin Darker (Кожа темнее)

  // Волосы и прочее
  h: '#3d2314', // Hair/Mustache (Волосы/Усы - тёмно-коричневый)
  b: '#000000', // Black (Чёрный - штаны, очки)
  
  // Одежда
  P: '#ff8ad8', // Pink (Розовый - поло Сексизма)
  W: '#ffffff', // White (Белый - фартук, рубашка)
  B: '#0077be', // Blue (Синий - берет художника, используется в miscArt)
  U: '#4a5568', // Uniform blue-gray for Guard
  w: '#e2e8f0', // White hair highlights for Guard

  // Специальные цвета
  R: '#ff0000', // Red (Красный - визор Чёрного Игрока)
  m: '#8b0000', // Mouth Interior (Внутренняя часть рта)

  // Цвета для трусов
  E: '#4682b4', // Elastic band blue
  L: '#e0e0e0', // Light gray shading
  M: '#c0c0c0', // Medium gray shading
  
  // Цвета шампанского
  y: '#ffdbac', // Champagne liquid
  g: '#006400', // Green bottle glass

  // Цвета рябины
  O: '#ff6600', // Orange (rowanberries)
  G: '#005522', // Dark Green (rowanberry leaves)

  // Прозрачный
  ' ': 'transparent',
};

// Сексизм (Pink Polo)
const SEXISM_ART_DATA = [
"                    ",
"                    ",
"     bbbbbbbb     ",
"    bssssssb    ",
"   bssssssssb   ",
"  bssssssssssb  ",
"  sddssssssdds  ",
"  sdd s s dd s  ",
"  sss h h sss  ",
"  ssh h h hss  ",
"  ss hhhhhh ss  ",
"   ss hhh sss   ",
"    sdddddds    ",
"    b P b P b    ",
"   bPPbPPPbPPb   ",
"  bPPP P P PPPb  ",
"  bPPP P P PPPb  ",
"  bPPPPPPPPPPPb  ",
"  bPPPPPPPPPPPb  ",
"   bPPPPPPPPPb   ",
"    bPPPPPPPb    ",
"    bbb bbb     ",
"   b b   b b    ",
"  bbb   bbb   ",
"  b b   b b   ",
" b b     b b    ",
" b b     b b    ",
"                    ",
"                    ",
"                    ",
"                    ",
];


// Канила Дозловский (Blue Shirt)
const KANILA_ART_DATA = [
"                    ",
"                    ",
"                    ",
"      hhhhhh      ",
"     hhhhhhhh     ",
"    hssddssssh    ",
"   hssddddssssh   ",
"   ssd s s dss s   ",
"  ss  s s s  ss  ",
"  ss         ss  ",
"  s dddddddd s  ",
"   s dddddd s   ",
"    sdddddds    ",
"    b B b B b    ",
"   bBBbBBBBBb   ",
"  bBBB B B BBBb  ",
"  bBBBBBBBBBBBb  ",
"  bBBBBBBBBBBBb  ",
"   bBBBBBBBBBb   ",
"    bBBBBBBBb    ",
"    bbb bbb     ",
"   b b   b b    ",
"  bbb   bbb   ",
"  b b   b b   ",
" b b     b b    ",
" b b     b b    ",
"                    ",
"                    ",
"                    ",
"                    ",
];


// Чёрный Игрок
const BLACK_PLAYER_ART_DATA = [
"                    ",
"                    ",
"                    ",
"       bbbb       ",
"      bbbbbb      ",
"     bbbbbbbb     ",
"    bbbbbbbbbb    ",
"   bbbRRRRRRbbb   ",
"   bbbbbbbbbbbb   ",
"    bWbbbbbbWb    ",
"   bWWWWWWWWWWb   ",
"   bWbWWWWWWbWb   ",
"  bWWbWWWWWWbWWb  ",
"  bWWbWWWWWWbWWb  ",
"  bWWbWWWWWWbWWb  ",
"  bWWWWWWWWWWWWb  ",
"  bWWWWWWWWWWWWb  ",
"   bWWWWWWWWWWb   ",
"    bWWWWWWWWb    ",
"     bbbbbbbb     ",
"     bbbbbbbb     ",
"    bbbbbbbbbb    ",
"    bbbbbbbbbb    ",
"   bbbb  bbbb   ",
"   bbbb  bbbb   ",
"   bbbb  bbbb   ",
"                    ",
"                    ",
"                    ",
"                    ",
"                    ",
];

// Арт "Обычного Игрока" для мини-игры "Становление"
export const ORDINARY_PLAYER_ART_DATA = [
"                    ",
"                    ",
"      MMMMMM      ",
"     MWWWWWWM     ",
"    MWbWbWbWWM    ",
"    MWWWWWWWWM    ",
"     MWWWWWWM     ",
"      MMMMMM      ",
"     M L L M      ",
"   M L LLL L M    ",
"  M L LLLLL L M   ",
"  M LLLLLLLL M    ",
"  M L LLLLL L M   ",
"   M L L L L M    ",
"    M M M M       ",
"   M M   M M      ",
"  M M     M M     ",
" MMM       MMM    ",
"                    ",
"                    ",
"                    ",
"                    ",
"                    ",
"                    ",
"                    ",
"                    ",
"                    ",
"                    ",
"                    ",
"                    ",
];


// Карта, сопоставляющая персонажей с их пиксель-артом.
export const CHARACTER_ART_MAP = {
  [Character.KANILA]: KANILA_ART_DATA,
  [Character.SEXISM]: SEXISM_ART_DATA,
  [Character.BLACK_PLAYER]: BLACK_PLAYER_ART_DATA,
};

// Mini character art for 'Tanec u Zakrytyh Dverey' minigame
export const MINI_CHARACTER_ART_MAP = {
  [Character.KANILA]: [ // 6x9
    " hhhh ",
    "hssssh",
    "s d ds",
    "sdddds",
    " BBBb ",
    "bB B b",
    "bBBBBb",
    " bbb  ",
    " b  b ",
  ],
  [Character.SEXISM]: [ // 6x9
    " hhhh ",
    "hssssh",
    "s d ds",
    "sdddds",
    " PPPb ",
    "bP P b",
    "bPPPPb",
    " bbb  ",
    " b  b ",
  ],
  [Character.BLACK_PLAYER]: [ // 6x9
    "      ",
    " bbbb ",
    "bRRRRb",
    "bbbbbb",
    "bWWWWb",
    "bWbWbW",
    "bWWWWb",
    " bbb  ",
    " b  b ",
  ],
};


// Пиксель-арт голов персонажей для мини-игры "Не Подавись!".
// Используется увеличенный размер для детализации.
export const NEPODAVIS_HEAD_ART = {
  [Character.KANILA]: [
    "                        ",
    "      hhhhhhhhhh      ",
    "     h hhhhhhhh h     ",
    "    h hssssssssh h    ",
    "   hss s ssssss ssh   ",
    "  hss s ssssss s ssh  ",
    " hss s ssssssss s ssh ",
    "hss s s ssssss s s ssh",
    "h s s s ssssss s s s h",
    "h s s s ssssss s s s h",
    "h s s s mmmmmm s s s h",
    "h s s s mmmmmmm s s s h",
    "h s s mmmmmmmmmm s s h",
    " h s s mmmmmmmm s s h ",
    "  h s s mmmmmm s s h  ",
    "   h s s mmmm s s h   ",
    "    h s s ss s s h    ",
    "     h ssssss h     ",
    "      hssssssh      ",
    "     BBBBBBBBBB     ",
    "    BBBBBBBBBBBB    ",
    "   BBBBBBBBBBBBBB   ",
    "  BBBBBBBBBBBBBBBB  ",
    "                        ",
  ],
  [Character.SEXISM]: [
    "                        ",
    "      hhhhhhhhhh      ",
    "     h hhhhhhhh h     ",
    "    h hddddddddh h    ",
    "   hss dddddddd ssh   ",
    "  hss d dddddd d ssh  ",
    " hss d bbbbbb d d ssh ",
    "hss d d bbbbbb d d ssh",
    "h s d d dddddd d d s h",
    "h s h h hhhhhh h h s h",
    "h s h h hhhhhh h h s h",
    "h s s d mmmmmm d s s h",
    "h s s d mmmmmmm d s s h",
    "h s s dmmmmmmmmm d s h",
    " h s s dmmmmmmm d s h ",
    "  h s s dmmmmm d s h  ",
    "   h s s dddd s s h   ",
    "    h s s dd s s h    ",
    "     h ssssss h     ",
    "      hssssssh      ",
    "     PPPPPPPPPP     ",
    "    PPPPPPPPPPPP    ",
    "   PPPPPPPPPPPPPP   ",
    "                        ",
  ],
  [Character.BLACK_PLAYER]: [
    "                        ",
    "       bbbbbbbb       ",
    "      bbbbbbbbbb      ",
    "     bbbbbbbbbbbb     ",
    "    bbbbRRRRRRbbbb    ",
    "   bbbRRRRRRRRRRbbb   ",
    "  bbbRRRRRRRRRRRRbbb  ",
    " bbbRRRRRRRRRRRRRRbbb ",
    " bbbRRRRRRRRRRRRRRbbb ",
    " bbbbbbbbbbbbbbbbbb ",
    " bbb  mmmmmmmm  bbbb ",
    " bbb mmmmmmmmmm bbbb ",
    " bbb mmmmmmmmmm bbbb ",
    " bbb mmmmmmmmmm bbbb ",
    " bbb  mmmmmmmm  bbbb ",
    " bbbbbbbbbbbbbbbbbbbb ",
    " bWWWWWWWWWWWWWWWWb ",
    "  bWWWWWWWWWWWWWWb  ",
    "   bWWWWWWWWWWWWb   ",
    "    bWWWWWWWWWWb    ",
    "     bWWWWWWWWb     ",
    "      bWWWWWWb      ",
    "       bbbbbb       ",
    "                        ",
  ],
};
