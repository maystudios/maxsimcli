const MAX_SCROLLBACK = 50_000;

export class SessionStore {
  private scrollback: string[] = [];

  append(data: string): void {
    this.scrollback.push(data);
    // Trim in larger batches to amortize array copy cost
    if (this.scrollback.length > MAX_SCROLLBACK * 1.5) {
      this.scrollback = this.scrollback.slice(-MAX_SCROLLBACK);
    }
  }

  getAll(): string {
    return this.scrollback.join('');
  }

  clear(): void {
    this.scrollback = [];
  }
}
