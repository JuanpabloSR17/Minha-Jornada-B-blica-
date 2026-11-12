import bible from './bible-books.json';

type Book = { code: string; name: string; chapters: number; testament: 'AT' | 'NT' };
export const BOOKS = bible as Book[];
export const bookName = (code: string) => BOOKS.find((b) => b.code === code)?.name ?? code;
export const refLabel = (book: string, chapter: number) => `${bookName(book)} ${chapter}`;
