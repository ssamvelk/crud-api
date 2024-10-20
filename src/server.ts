import * as http from 'http';
import * as fs from 'fs/promises';
import { v4 as uuidv4, validate } from 'uuid';
import * as dotenv from 'dotenv';
import * as url from 'url';

dotenv.config();

const PORT = process.env.PORT || 4000;
const DATA_FILE = 'users.json';

interface IUser {
  id: string;
  username: string;
  age: number;
  hobbies: string[];
}

// Функция для чтения данных из файла
async function readData(): Promise<IUser[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Функция для записи данных в файл
async function writeData(users: IUser[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
}

// Обработчик запросов
const requestHandler = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  try {
    const parsedUrl = url.parse(req.url || '', true);
    const { pathname } = parsedUrl;

    if (pathname === '/api/users') {
      switch (req.method) {
        case 'GET':
          const users = await readData();

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(users));

          break;

        case 'POST':
          let body = '';

          req.on('data', (chunk) => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            const {
              username,
              age,
              hobbies,
            }: { username: string; age: number; hobbies: string[] } =
              JSON.parse(body);

            if (!username || !age || !Array.isArray(hobbies)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Invalid input' }));

              return;
            }

            const newUser: IUser = { id: uuidv4(), username, age, hobbies };

            const users = await readData();

            users.push(newUser);

            await writeData(users);

            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(newUser));
          });

          break;

        default:
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Method not allowed' }));

          break;
      }
    } else if (pathname?.startsWith('/api/users/')) {
      const userId = pathname.split('/api/users/')[1]; // Получаем userId из URL
      console.log('>>>userId', userId);

      if (!userId || !validate(userId)) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Invalid user ID' }));

        return;
      }

      switch (req.method) {
        case 'GET':
          // Получаем пользователя по ID
          const users = await readData();
          const user = users.find((u) => u.id === userId);

          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User  not found' }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(user));
          }

          break;

        case 'PUT':
          let body = '';

          req.on('data', (chunk) => {
            body += chunk.toString();
          });

          req.on('end', async () => {
            const {
              username,
              age,
              hobbies,
            }: { username: string; age: number; hobbies: string[] } =
              JSON.parse(body);

            if (!username && !age && !Array.isArray(hobbies)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'Invalid input' }));

              return;
            }

            const users = await readData();
            const index = users.findIndex((u) => u.id === userId);

            if (index === -1) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: 'User  not found' }));

              return;
            }

            if (username) {
              users[index].username = username;
            }

            if (age) {
              users[index].age = age;
            }

            if (username) {
              users[index].hobbies = hobbies;
            }

            await writeData(users);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(users[index]));
          });

          break;

        case 'DELETE':
          const allUsers = await readData();
          const index = allUsers.findIndex((u) => u.id === userId);

          if (index === -1) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'User  not found' }));

            return;
          }

          allUsers.splice(index, 1);

          await writeData(allUsers);

          res.writeHead(204, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'User deleted' }));

          break;

        default:
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Method not allowed' }));

          break;
      }
    } else {
      // Обработка несуществующих маршрутов
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Endpoint not found' }));
    }
  } catch (error) {
    console.error('Server error:', error);

    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Internal server error' }));
  }
};

// Создаем и запускаем сервер
const server = http.createServer(requestHandler);
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
