/** Thrown from services/controllers; turned into `{ error: message }` by the error handler. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFound = (message: string) => new HttpError(404, message);
