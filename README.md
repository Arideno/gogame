#Online multiplayer Go Game prototype using sockets

#Technologies used
1. Golang for backend (libraries used: gin, websockets, sqlx, pgx)
2. ReactJS for frontend (libraries used: react-router-dom, use-sound, lodash, bootstrap)
3. PostgreSQL as persistent storage
4. Redis as temporary storage

The platform has an ability to hold matches for any amount of users. Each player can create a game and wait until another
player accepts the game. All the users can watch any game in real time with the help of WebSockets.
In the future I am going to add rating system and realtime chat between users.

#To run
docker-compose up