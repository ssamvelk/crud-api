import { IUser } from './interfaces';
import * as fs from 'fs/promises';

const DATA_FILE = 'users.json';

export async function readData(): Promise<IUser[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');

    return JSON.parse(data);
  } catch (error) {
    await resetDataFile();

    return [];
  }
}

export async function writeData(users: IUser[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
}

export const resetDataFile = async () => {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  }

  await fs.writeFile(DATA_FILE, JSON.stringify([]));
};
