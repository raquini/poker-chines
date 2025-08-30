import { Card, Suit, Rank } from './types';

export class Deck {
  private cards: Card[] = [];
  
  constructor() {
    this.initializeDeck();
    this.shuffle();
  }
  
  private initializeDeck(): void {
    const suits = Object.values(Suit);
    const ranks = Object.values(Rank);
    
    const rankValues: Record<Rank, number> = {
      [Rank.Three]: 3,
      [Rank.Four]: 4,
      [Rank.Five]: 5,
      [Rank.Six]: 6,
      [Rank.Seven]: 7,
      [Rank.Eight]: 8,
      [Rank.Nine]: 9,
      [Rank.Ten]: 10,
      [Rank.Jack]: 11,
      [Rank.Queen]: 12,
      [Rank.King]: 13,
      [Rank.Ace]: 14,
      [Rank.Two]: 15
    };
    
    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push({
          suit,
          rank,
          value: rankValues[rank]
        });
      }
    }
  }
  
  private shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }
  
  public deal(count: number): Card[] {
    if (count > this.cards.length) {
      throw new Error(`Cannot deal ${count} cards, only ${this.cards.length} remaining`);
    }
    return this.cards.splice(0, count);
  }
  
  public getCards(): Card[] {
    return [...this.cards];
  }
  
  public getRemainingCount(): number {
    return this.cards.length;
  }
  
  public reset(): void {
    this.cards = [];
    this.initializeDeck();
    this.shuffle();
  }
}