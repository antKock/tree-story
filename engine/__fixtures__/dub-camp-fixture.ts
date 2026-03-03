import type { StoryConfig } from '../types'

/**
 * Minimal Dub Camp story config fixture for testing all engine mechanics.
 * Not a full 53-paragraph translation — just enough to exercise:
 * - 4 stats, 5 gauges, decay nodes, all 4 Game Over paths
 * - Weighted outcomes (outcomes[] shape), inventory, act transitions, completion
 * - Score multipliers, contextual game over, composite game over, conditional branching
 */
export const dubCampFixture: StoryConfig = {
  id: 'dub-camp-test',
  version: 1,
  startParagraphId: 's1',
  statPointBudget: 10,
  meta: {
    title: 'Dub Camp Test',
    author: 'Test',
    version: '1.0',
    exampleProfiles: [
      {
        name: 'Balanced',
        stats: { endurance: 2, estomac: 3, resistanceAlcool: 3, resistanceFumette: 2 },
        description: 'A balanced profile',
      },
    ],
  },
  stats: [
    { id: 'endurance', name: 'Endurance', maxPerStat: 4 },
    { id: 'estomac', name: 'Estomac', maxPerStat: 4 },
    { id: 'resistanceAlcool', name: 'Résistance Alcool', maxPerStat: 4 },
    { id: 'resistanceFumette', name: 'Résistance Fumette', maxPerStat: 4 },
  ],
  gauges: [
    {
      id: 'energie',
      name: 'Énergie',
      icon: '⚡',
      initialValue: 100,
      isScore: false,
      isHidden: false,
      gameOverThreshold: 0,
      gameOverCondition: 'below' as const,
      gameOverParagraphId: 's204',
    },
    {
      id: 'alcool',
      name: 'Alcool',
      icon: '🍺',
      initialValue: 0,
      isScore: false,
      isHidden: false,
      gameOverThreshold: 85,
      gameOverCondition: 'above' as const,
      gameOverParagraphId: 's201',
    },
    {
      id: 'fumette',
      name: 'Fumette',
      icon: '🌿',
      initialValue: 0,
      isScore: false,
      isHidden: false,
      gameOverThreshold: 85,
      gameOverCondition: 'above' as const,
      gameOverParagraphId: 's202',
    },
    {
      id: 'nourriture',
      name: 'Nourriture',
      icon: '🍔',
      initialValue: 50,
      isScore: false,
      isHidden: false,
      // No gameOverThreshold — food GO is via compositeGameOverRules
    },
    {
      id: 'kiff',
      name: 'Kiff',
      icon: '✨',
      initialValue: 0,
      isScore: true,
      isHidden: true,
      maxValue: 200,
    },
  ],
  acts: [
    {
      id: 'act1',
      name: 'Arrivée',
      paragraphIds: ['s1', 's10'],
      theme: { '--color-bg': '#1a1a2e', '--color-accent': '#e94560' },
    },
    {
      id: 'act2',
      name: 'Première Nuit',
      paragraphIds: ['s20', 's30'],
      theme: { '--color-bg': '#16213e', '--color-accent': '#0f3460' },
    },
    {
      id: 'act3',
      name: 'Journée',
      paragraphIds: ['s40', 's41', 's50', 'sEVT1', 'sAlt'],
      theme: { '--color-bg': '#1a1a1a', '--color-accent': '#533483' },
    },
    {
      id: 'act4',
      name: 'Dernière Nuit',
      paragraphIds: ['s60', 's70', 's80'],
      theme: { '--color-bg': '#0d0d0d', '--color-accent': '#e94560' },
    },
  ],
  decayNodes: ['s20', 's40', 's50', 's60', 's70'],
  decayRules: [
    // Nourriture decay: base -10, reduced by Estomac stat
    {
      gaugeId: 'nourriture',
      amount: -10,
      statReductionId: 'estomac',
      statReductionFormula: 'max(3, 10 - stat * 1.5)',
    },
    // Passive energy risk: 6% chance of -8 energie
    {
      gaugeId: 'energie',
      amount: -8,
      probabilityChance: 0.06,
    },
  ],
  scoreMultipliers: [
    {
      conditions: [
        { gaugeId: 'alcool', min: 20, max: 55 },
        { gaugeId: 'fumette', min: 20, max: 55 },
      ],
      multiplier: 1.4,
    },
  ],
  compositeGameOverRules: [
    {
      conditions: [
        { gaugeId: 'alcool', min: 60 },
        { gaugeId: 'nourriture', max: 20 },
      ],
      probability: 0.22,
      targetParagraphId: 's203',
    },
  ],
  paragraphs: {
    s1: {
      id: 's1',
      content: 'Tu arrives au Dub Camp. Le son basse résonne au loin.',
      choices: [
        {
          id: 'c1a',
          text: 'Explorer le camping',
          targetParagraphId: 's10',
          gaugeEffects: [{ gaugeId: 'energie', delta: -5 }],
        },
        {
          id: 'c1b',
          text: 'Aller directement au bar',
          targetParagraphId: 's10',
          gaugeEffects: [
            { gaugeId: 'alcool', delta: 20 },
            { gaugeId: 'kiff', delta: 3 },
          ],
        },
      ],
    },
    s10: {
      id: 's10',
      content: 'Tu fais le tour du festival.',
      choices: [
        {
          id: 'c10a',
          text: 'Continuer vers la scène',
          targetParagraphId: 's20',
          gaugeEffects: [{ gaugeId: 'energie', delta: -10 }],
        },
        {
          id: 'c10b',
          text: 'Boire un verre',
          targetParagraphId: 's20',
          gaugeEffects: [
            { gaugeId: 'alcool', delta: 15 },
            { gaugeId: 'energie', delta: -5, statInfluence: { statId: 'endurance', multiplier: 2 } },
          ],
          weightedOutcome: {
            gaugeId: 'alcool',
            statId: 'resistanceAlcool',
            hungerGaugeId: 'nourriture',
            outcomes: [
              {
                id: 'a',
                maxRisk: 60,
                text: 'Good outcome.',
                effects: [{ gaugeId: 'kiff', delta: 5 }],
              },
              {
                id: 'b',
                maxRisk: 100,
                text: 'Bad outcome.',
                effects: [{ gaugeId: 'alcool', delta: 10 }],
              },
            ],
          },
          conditionalBranch: { probability: 0.33, targetParagraphId: 'sAlt' },
        },
      ],
    },
    s20: {
      id: 's20',
      content: 'La première nuit commence. Le dub résonne.',
      choices: [
        {
          id: 'c20a',
          text: 'Danser toute la nuit',
          targetParagraphId: 's30',
          gaugeEffects: [
            { gaugeId: 'energie', delta: -20 },
            { gaugeId: 'kiff', delta: 5 },
          ],
        },
        {
          id: 'c20b',
          text: 'Se poser tranquille',
          targetParagraphId: 's30',
          gaugeEffects: [{ gaugeId: 'energie', delta: -5 }],
        },
      ],
    },
    s30: {
      id: 's30',
      content: 'Le matin se lève sur le camp.',
      choices: [
        {
          id: 'c30a',
          text: 'Petit-déjeuner copieux',
          targetParagraphId: 's40',
          gaugeEffects: [{ gaugeId: 'nourriture', delta: 20 }],
        },
        {
          id: 'c30b',
          text: 'Fumer un joint',
          targetParagraphId: 's40',
          gaugeEffects: [
            { gaugeId: 'fumette', delta: 25 },
            { gaugeId: 'kiff', delta: 3 },
          ],
        },
      ],
    },
    s40: {
      id: 's40',
      content: 'La journée du deuxième jour.',
      choices: [
        {
          id: 'c40a',
          text: 'Aller aux ateliers',
          targetParagraphId: 's50',
          gaugeEffects: [
            { gaugeId: 'energie', delta: -10 },
            { gaugeId: 'kiff', delta: 5 },
          ],
        },
        {
          id: 'c40b',
          text: 'Partir volontairement',
          targetParagraphId: 's41',
          gaugeEffects: [{ gaugeId: 'kiff', delta: 5 }],
        },
        {
          id: 'c40c',
          text: 'Boire beaucoup',
          targetParagraphId: 's50',
          gaugeEffects: [
            { gaugeId: 'alcool', delta: 40 },
            { gaugeId: 'kiff', delta: 2 },
          ],
        },
        {
          id: 'c40d',
          text: 'Manger un peu',
          targetParagraphId: 's50',
          gaugeEffects: [{ gaugeId: 'nourriture', delta: 10 }],
          inventoryAdd: ['sandwich'],
        },
      ],
    },
    s41: {
      id: 's41',
      content: 'Tu décides de partir. Belle expérience quand même !',
      choices: [],
      isComplete: true,
    },
    s50: {
      id: 's50',
      content: "L'après-midi bat son plein. Chaleur étouffante.",
      choices: [
        {
          id: 'c50a',
          text: 'Résister à la chaleur',
          targetParagraphId: 's60',
          gaugeEffects: [
            { gaugeId: 'energie', delta: -15 },
          ],
        },
        {
          id: 'c50b',
          text: 'Se baigner',
          targetParagraphId: 's60',
          gaugeEffects: [
            { gaugeId: 'energie', delta: 10 },
            { gaugeId: 'kiff', delta: 3 },
          ],
        },
      ],
    },
    sEVT1: {
      id: 'sEVT1',
      content: 'Un événement aléatoire se produit !',
      choices: [
        {
          id: 'cEVT1a',
          text: 'Participer',
          targetParagraphId: 's60',
          gaugeEffects: [{ gaugeId: 'kiff', delta: 10 }],
          weightedOutcome: {
            gaugeId: 'alcool',
            statId: 'resistanceAlcool',
            hungerGaugeId: 'nourriture',
            outcomes: [
              {
                id: 'a',
                maxRisk: 60,
                text: 'Super soirée !',
                effects: [{ gaugeId: 'kiff', delta: 8 }],
              },
              {
                id: 'b',
                maxRisk: 100,
                text: 'Trop de pression...',
                effects: [
                  { gaugeId: 'alcool', delta: 15 },
                  { gaugeId: 'energie', delta: -10 },
                ],
              },
            ],
          },
        },
      ],
    },
    sAlt: {
      id: 'sAlt',
      content: 'Tu bifurques vers une scène alternative.',
      choices: [],
      isComplete: true,
    },
    s60: {
      id: 's60',
      content: 'La dernière nuit commence.',
      choices: [
        {
          id: 'c60a',
          text: 'Tout donner',
          targetParagraphId: 's70',
          gaugeEffects: [
            { gaugeId: 'energie', delta: -25 },
            { gaugeId: 'alcool', delta: 20 },
            { gaugeId: 'kiff', delta: 10 },
          ],
        },
        {
          id: 'c60b',
          text: 'Profiter tranquillement',
          targetParagraphId: 's70',
          gaugeEffects: [
            { gaugeId: 'energie', delta: -10 },
            { gaugeId: 'kiff', delta: 5 },
          ],
        },
      ],
    },
    s70: {
      id: 's70',
      content: 'Le dernier set. Le soleil se lève.',
      choices: [
        {
          id: 'c70a',
          text: 'Finir en beauté',
          targetParagraphId: 's80',
          gaugeEffects: [
            { gaugeId: 'energie', delta: -10 },
            { gaugeId: 'kiff', delta: 10 },
          ],
        },
      ],
    },
    s80: {
      id: 's80',
      content: 'Le Dub Camp est terminé. Quelle aventure !',
      choices: [],
      isComplete: true,
    },
    // Game Over paragraphs
    s201: {
      id: 's201',
      content: "Trop bu trop tôt... Tu t'effondres.",
      choices: [],
      isGameOver: true,
    },
    s202: {
      id: 's202',
      content: 'Dans le gaz... Tu perds le fil.',
      choices: [],
      isGameOver: true,
    },
    s203: {
      id: 's203',
      content: "Pas assez mangé... Tu ne tiens plus.",
      choices: [],
      isGameOver: true,
    },
    s204: {
      id: 's204',
      content: "Épuisement total. Tu t'endors sur place.",
      choices: [],
      isGameOver: true,
    },
  },
  endStateTiers: [
    { minScore: 0, maxScore: 39, text: 'Bof, pas terrible...' },
    { minScore: 40, maxScore: 69, text: 'Pas mal, mais peut mieux faire.' },
    { minScore: 70, maxScore: 99, text: 'Bon festival !' },
    { minScore: 100, maxScore: 9999, text: 'Légendaire !' },
  ],
}
