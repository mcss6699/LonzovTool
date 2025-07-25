// @ts-ignore
const { Typed } = window;

const typed2 = new Typed('#strike', {
  strings: [
    'olà',
    'hi',
    'hey',
    "g'day",
    '你好',
    '在吗？',
    'bonjour',
    'yo',
    'hola',
    'morning!',
    'hallo',
    'ciao',
    '&#128075;',
    'namaste',
    'hoi',
    'Ciαllο ~ (< · ω< )',
    "m'athchomaroon",
    'hiya',
    'Привет',
    'you got a sec?',
    'مرحبا',
    'greetings!',
    'aloha',
    'こんにちは',
    'buenos dias',
    'nuqneH',
    'heya',
    'hello',
    'apipoulaï',
    'j0',
    'howdy',
    'שלום',
    'yooooooooooo!',
    'you there?',
    'fraeslis',
    '여보세요',
    'sul sul',
    'quick question...',
    'achuta',
    'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
    'ping',
    'Χαίρετε',
    'سلام',
  ],
  typeSpeed: 80,
  backSpeed: 60,
  smartBackspace: false,
  loop: true,
  shuffle: false,
  backDelay: 2000,
  startDelay: 3000,
});

// force the start of cursor animation while the `startDelay` is ticking
if (typed2.cursor != null) {
  // can't use `toggleBlinking(true)` here, as it has some extra checks
  // whether animation has started...which defeats the purpose
  typed2.cursor.classList.add('typed-cursor--blink');
}
