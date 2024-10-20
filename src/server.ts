import * as http from 'http';
import { v4 as uuidv4, validate } from 'uuid';
import * as dotenv from 'dotenv';
import * as url from 'url';

import { ErrorMessage } from '../src/helpers/enums.ts';
import { readData, writeData } from './helpers/fs.helper.ts';
import { IUser } from './helpers/interfaces.ts';

dotenv.config();

const PORT = process.env.PORT || 4000;

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
              res.end(JSON.stringify({ message: ErrorMessage.INVALID_INPUT }));

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
          res.end(JSON.stringify({ message: ErrorMessage.METHOD_NOT_ALLOWED }));

          break;
      }
    } else if (pathname?.startsWith('/api/users/')) {
      const userId = pathname.split('/api/users/')[1];

      if (!userId || !validate(userId)) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: ErrorMessage.INVALID_USER_ID }));

        return;
      }

      switch (req.method) {
        case 'GET':
          const users = await readData();
          const user = users.find((u) => u.id === userId);

          if (!user) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: ErrorMessage.USER_NOT_FOUNT }));
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
            const { username, age, hobbies }: Omit<IUser, 'id'> =
              JSON.parse(body);

            if (!username && !age && !Array.isArray(hobbies)) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: ErrorMessage.INVALID_INPUT }));

              return;
            }

            const users = await readData();
            const index = users.findIndex((u) => u.id === userId);

            if (index === -1) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ message: ErrorMessage.USER_NOT_FOUNT }));

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
            res.end(JSON.stringify({ message: ErrorMessage.USER_NOT_FOUNT }));

            return;
          }

          allUsers.splice(index, 1);

          await writeData(allUsers);

          res.writeHead(204, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'User deleted' }));

          break;

        default:
          res.writeHead(405, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: ErrorMessage.METHOD_NOT_ALLOWED }));

          break;
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: ErrorMessage.ENDROINT_NOT_FOUND }));
    }
  } catch (error) {
    console.error('Server error:', error);

    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: ErrorMessage.INTERNAL_SERVER_ERROR }));
  }
};

export const createServer = () => {
  const server = http.createServer(requestHandler);

  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  return server;
};

if (require.main === module) {
  createServer();
}
