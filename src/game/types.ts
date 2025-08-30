export enum Suit {
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Hearts = 'hearts',
  Spades = 'spades'
}

export enum Rank {
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
  Two = '2'
}

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  isStartingPlayer: boolean;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  currentPlayerIndex: number;
  gameStarted: boolean;
}