
interface MovieReview {
  id: string | number;
  review: string;
  rating: number;
}

// Curated reviews for popular movies and series
const movieReviews: Record<string, MovieReview> = {
  // Marvel Movies
  '299536': {
    id: '299536',
    review: "A cinematic masterpiece that perfectly balances humor, heart, and spectacular action. The Russo Brothers deliver an emotional rollercoaster that redefines superhero storytelling, with outstanding performances from the entire ensemble cast.",
    rating: 9.2
  },
  '299534': {
    id: '299534',
    review: "An epic conclusion that brings together years of storytelling into one magnificent finale. Despite its ambitious scope, it delivers satisfying character arcs and breathtaking visuals that will leave audiences in awe.",
    rating: 9.0
  },
  '348350': {
    id: '348350',
    review: "A refreshing take on the superhero genre with incredible world-building and stunning visuals. The film masterfully blends action, comedy, and emotional depth while introducing audiences to a vibrant new corner of the Marvel universe.",
    rating: 8.8
  },
  
  // Popular TV Series
  '1399': {
    id: '1399',
    review: "A groundbreaking fantasy epic that redefined television storytelling. Despite its controversial ending, the series remains a cultural phenomenon with unmatched production values, complex characters, and political intrigue that keeps viewers captivated.",
    rating: 8.5
  },
  '1396': {
    id: '1396',
    review: "A masterclass in character development and storytelling that transforms from a high school chemistry teacher's descent into darkness. Bryan Cranston's powerhouse performance anchors this intense crime drama that explores morality and consequences.",
    rating: 9.5
  },
  '66732': {
    id: '66732',
    review: "A nostalgic journey that perfectly captures 1980s horror and sci-fi aesthetics. The young cast delivers compelling performances while the show balances supernatural thrills with genuine emotional moments and friendship dynamics.",
    rating: 8.7
  },

  // Anime Series
  '85937': {
    id: '85937',
    review: "A visually stunning anime that revolutionizes the medium with its unique animation style and compelling narrative. The series explores themes of survival, humanity, and sacrifice while delivering some of the most intense action sequences in anime history.",
    rating: 9.1
  },
  '31964': {
    id: '31964',
    review: "A supernatural thriller that combines psychological horror with stunning visuals and an unforgettable soundtrack. The series masterfully builds tension while exploring themes of death, justice, and moral complexity.",
    rating: 8.9
  },

  // Classic Movies
  '155': {
    id: '155',
    review: "Christopher Nolan's mind-bending masterpiece that challenges perception and reality. A film that rewards multiple viewings, featuring stunning cinematography, exceptional performances, and a haunting score that creates an unforgettable cinematic experience.",
    rating: 9.3
  },
  '278': {
    id: '278',
    review: "A timeless tale of hope, friendship, and redemption that transcends its prison setting. Morgan Freeman and Tim Robbins deliver career-defining performances in this emotionally powerful story that continues to inspire audiences decades later.",
    rating: 9.4
  },
  '238': {
    id: '238',
    review: "Francis Ford Coppola's epic crime saga that defines cinematic excellence. A perfect blend of family drama and crime thriller, featuring iconic performances and masterful storytelling that established the template for modern gangster films.",
    rating: 9.2
  },

  // Horror Movies
  '346364': {
    id: '346364',
    review: "A terrifying return to form for the horror genre that successfully reinvents a classic monster. The film masterfully builds tension through atmosphere and character development, delivering genuine scares without relying on cheap thrills.",
    rating: 8.3
  },
  '419704': {
    id: '419704',
    review: "A supernatural horror film that creates genuine dread through masterful sound design and atmospheric tension. The movie proves that sometimes what you don't see is far more terrifying than what you do.",
    rating: 8.1
  },

  // Sci-Fi Movies
  '157336': {
    id: '157336',
    review: "Christopher Nolan's ambitious space odyssey that combines hard science with emotional storytelling. The film explores love, sacrifice, and humanity's survival instinct while delivering breathtaking visuals and a powerful Hans Zimmer score.",
    rating: 8.9
  },
  '181808': {
    id: '181808',
    review: "A visually stunning sci-fi thriller that explores themes of identity, consciousness, and what makes us human. The film's blend of philosophical depth and action sequences creates a thought-provoking experience that lingers long after viewing.",
    rating: 8.4
  }
};

export const reviewService = {
  getReview: (tmdbId: string | number): MovieReview | null => {
    const review = movieReviews[tmdbId.toString()];
    return review || null;
  },

  getDefaultReview: (title: string, isTV: boolean): MovieReview => {
    const reviews = [
      {
        review: `An engaging ${isTV ? 'series' : 'film'} that offers compelling storytelling and memorable characters. The production values are solid, and the narrative keeps viewers invested throughout. A worthwhile addition to any watchlist.`,
        rating: 7.5
      },
      {
        review: `A well-crafted ${isTV ? 'series' : 'movie'} that delivers on its promises with strong performances and quality direction. The story unfolds naturally, offering both entertainment and emotional depth that resonates with audiences.`,
        rating: 7.8
      },
      {
        review: `This ${isTV ? 'series' : 'film'} stands out with its unique approach to storytelling and character development. The production team has created something that feels both familiar and fresh, making it an excellent choice for genre fans.`,
        rating: 8.0
      },
      {
        review: `A captivating ${isTV ? 'series' : 'film'} that showcases excellent writing and direction. The story is well-paced, the characters are relatable, and the overall experience is both entertaining and thought-provoking.`,
        rating: 7.6
      },
      {
        review: `An impressive ${isTV ? 'series' : 'movie'} that combines strong storytelling with quality production values. The narrative is engaging, the performances are convincing, and the overall result is a memorable viewing experience.`,
        rating: 7.9
      }
    ];
    
    // Use title to generate consistent random selection
    const index = title.length % reviews.length;
    return {
      id: 'default',
      ...reviews[index]
    };
  },

  getAllReviews: (): Record<string, MovieReview> => {
    return movieReviews;
  }
};
