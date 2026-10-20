/**
 * Rounds for the "Bot or human?" mini game (/play/bot-or-human).
 *
 * Sourcing rules, so the game stays honest:
 * - Every `human` item is a public-domain text (pre-1929 publication or a
 *   traditional proverb), quoted as published, with its author and source.
 *   Nothing here is a paraphrase or an invented quote put in a real person's mouth.
 * - Every `bot` item was written for this game by a language model, prompted to
 *   imitate the form of the human item. They are not quotes from anyone.
 *
 * To add a round, append an object below. Keep both items roughly the same
 * length and shape, otherwise the length alone gives the answer away.
 */

export interface BotOrHumanRound {
  id: string;
  /** Short label shown above the pair, e.g. "Two lines on hope". */
  prompt: string;
  human: {
    text: string;
    /** Author and work, shown on reveal. */
    source: string;
  };
  bot: {
    text: string;
  };
  /** One or two sentences shown on reveal: what gives the model away. */
  explanation: string;
}

export const rounds: BotOrHumanRound[] = [
  {
    id: 'hope',
    prompt: 'Two lines on hope',
    human: {
      text: 'Hope is the thing with feathers\nThat perches in the soul,',
      source: 'Emily Dickinson, “Hope” is the thing with feathers (pub. 1891)',
    },
    bot: { text: 'Hope is a lantern in the mind\nThat glows when all the stars are blind.' },
    explanation:
      'Dickinson calls hope a “thing” and leaves it odd and unrhymed. The model reaches for a stock image (a lantern) and a tidy rhyme that does not quite mean anything: stars are not blind.',
  },
  {
    id: 'grain',
    prompt: 'Two lines on seeing big things in small ones',
    human: {
      text: 'To see a World in a Grain of Sand\nAnd a Heaven in a Wild Flower,',
      source: 'William Blake, Auguries of Innocence (c. 1803)',
    },
    bot: { text: 'To find the ocean in a drop of rain\nAnd all of time within a single grain,' },
    explanation:
      'The imitation copies Blake’s frame and swaps nouns, then lands on “all of time,” a bigger abstraction than the line can hold. Blake keeps both halves concrete.',
  },
  {
    id: 'summer',
    prompt: 'An opening to a love poem',
    human: {
      text: 'Shall I compare thee to a summer’s day?\nThou art more lovely and more temperate:',
      source: 'William Shakespeare, Sonnet 18 (1609)',
    },
    bot: { text: 'Shall I compare you to the morning light?\nYou are more gentle and far more bright.' },
    explanation:
      'Count the beats: the human lines are clean iambic pentameter. The model’s second line is a syllable short, and “gentle and far more bright” piles up comparatives to force the rhyme.',
  },
  {
    id: 'early',
    prompt: 'A rule for a good life',
    human: {
      text: 'Early to bed and early to rise, makes a man healthy, wealthy, and wise.',
      source: 'Benjamin Franklin, Poor Richard’s Almanack (1735)',
    },
    bot: { text: 'Rise with the sun and rest with the moon, and fortune will find you soon.' },
    explanation:
      'Franklin promises three specific payoffs in a jingle. The model’s version is pleasant but vague (“fortune will find you”), and “soon” is there only because it rhymes with “moon.”',
  },
  {
    id: 'stitch',
    prompt: 'A proverb about fixing things early',
    human: {
      text: 'A stitch in time saves nine.',
      source: 'Traditional English proverb (recorded 1732)',
    },
    bot: { text: 'A small repair today spares a large one tomorrow.' },
    explanation:
      'Proverbs survive by compressing a lesson into one concrete picture. The model states the moral outright, which is clear and accurate and nobody would ever bother to repeat it.',
  },
  {
    id: 'beauty',
    prompt: 'The first line of a long poem',
    human: {
      text: 'A thing of beauty is a joy for ever:',
      source: 'John Keats, Endymion (1818)',
    },
    bot: { text: 'A thing of wonder lingers in the heart:' },
    explanation:
      'Hard one. Keats makes a flat, bold claim. The model hedges it into a feeling that “lingers,” and “in the heart” is one of the most common phrases in machine-written verse.',
  },
  {
    id: 'cloud',
    prompt: 'Two lines about wandering',
    human: {
      text: 'I wandered lonely as a cloud\nThat floats on high o’er vales and hills,',
      source: 'William Wordsworth, I Wandered Lonely as a Cloud (1807)',
    },
    bot: { text: 'I drifted softly like a breeze\nThat whispers through the ancient trees,' },
    explanation:
      'Breezes that whisper and trees that are ancient: every noun arrives with its most expected companion. Wordsworth’s “lonely” is the surprising word, and it does the work.',
  },
  {
    id: 'woods',
    prompt: 'Why someone went into the wild',
    human: {
      text: 'I went to the woods because I wished to live deliberately,',
      source: 'Henry David Thoreau, Walden (1854)',
    },
    bot: { text: 'I went to the mountains because I wanted to find a quieter version of myself,' },
    explanation:
      '“A quieter version of myself” is modern self-help language. Thoreau’s “deliberately” is one precise, slightly old-fashioned word doing the job of a whole phrase.',
  },
  {
    id: 'fortune',
    prompt: 'The opening line of a novel',
    human: {
      text: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.',
      source: 'Jane Austen, Pride and Prejudice (1813)',
    },
    bot: {
      text: 'It is widely understood that any man with a large fortune will, sooner or later, be expected to marry.',
    },
    explanation:
      'The same idea with the irony sanded off. Austen’s grand phrasing is the joke: the “truth” is really the neighbours’ wish. The model’s version is just a statement.',
  },
  {
    id: 'wind',
    prompt: 'The start of a nursery rhyme',
    human: {
      text: 'Who has seen the wind?\nNeither I nor you:',
      source: 'Christina Rossetti, Sing-Song (1872)',
    },
    bot: { text: 'Who has felt the rain?\nOnly the window pane:' },
    explanation:
      'Rossetti’s answer is a small surprise that pulls the reader in. The model’s answer is wrong (plenty of people have felt the rain) and exists to rhyme with “rain.”',
  },
  {
    id: 'myself',
    prompt: 'The opening of a long poem about the self',
    human: {
      text: 'I celebrate myself, and sing myself,\nAnd what I assume you shall assume,',
      source: 'Walt Whitman, Song of Myself (1855; this wording from 1881)',
    },
    bot: { text: 'I celebrate the self that I have found,\nAnd every voice that echoes all around.' },
    explanation:
      'Whitman writes free verse, so a neat end rhyme is a tell. “Echoes all around” is also filler: it fills out the metre without adding anything.',
  },
  {
    id: 'err',
    prompt: 'A line about mistakes',
    human: {
      text: 'To err is human, to forgive divine.',
      source: 'Alexander Pope, An Essay on Criticism (1711)',
    },
    bot: { text: 'To stumble is natural, to rise again is noble.' },
    explanation:
      'Pope packs it into ten syllables with a strong contrast. The model keeps the shape but swaps in softer, motivational words, and the rhythm goes slack.',
  },
  {
    id: 'loved',
    prompt: 'A couplet about loss',
    human: {
      text: '’Tis better to have loved and lost\nThan never to have loved at all.',
      source: 'Alfred, Lord Tennyson, In Memoriam A.H.H. (1850)',
    },
    bot: { text: 'It’s better to have dreamed and woken\nThan to have slept with dreams unspoken.' },
    explanation:
      'Tennyson repeats “loved” and does not rhyme the pair at all. The model forces “woken / unspoken,” and sleeping with “unspoken” dreams does not really hold together.',
  },
  {
    id: 'shadow',
    prompt: 'A children’s poem about a shadow',
    human: {
      text: 'I have a little shadow that goes in and out with me,\nAnd what can be the use of him is more than I can see.',
      source: 'Robert Louis Stevenson, A Child’s Garden of Verses (1885)',
    },
    bot: {
      text: 'I have a little friend who follows where I go,\nHe’s quiet when it’s sunny and he vanishes in snow.',
    },
    explanation:
      'It sounds fine until you check it: shadows are sharpest on bright snow. The model picked a rhyme for “go” and went with whatever claim came with it.',
  },
];
