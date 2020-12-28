# Online multiplayer Go Game prototype using sockets

# Technologies used
1. Golang for backend (libraries used: [gin](https://github.com/gin-gonic/gin), [websockets](https://github.com/gorilla/websocket), [sqlx](https://github.com/jmoiron/sqlx), [pgx](https://github.com/jackc/pgx))
2. ReactJS for frontend (libraries used: [react-router-dom](https://www.npmjs.com/package/react-router-dom), [use-sound](https://www.npmjs.com/package/use-sound), [lodash](https://www.npmjs.com/package/lodash), [bootstrap](https://www.npmjs.com/package/bootstrap))
3. PostgreSQL as persistent storage
4. Redis as temporary storage

The platform has an ability to hold matches for any amount of users. Each player can create a game and wait until another
player accepts the game. All the users can watch any game in real time with the help of WebSockets.
In the future I am going to add rating system and realtime chat between users.

# To run
`docker-compose up`
