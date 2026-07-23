export class ErreurEnvoiEmail extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ErreurEnvoiEmail"
  }
}
