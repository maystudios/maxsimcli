const MAX_SCROLLBACK = 50_000;

export class SessionStore {
  private scrollback: string[] = [];

  append(data: string): void {
    this.scrollback.push(data);
    if (this.scrollback.length > MAX_SCROLLBACK) {
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
