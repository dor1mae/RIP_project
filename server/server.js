const express = require("express")
const app = express()
const Sequelize = require("sequelize")
const cors = require("cors")
const http = require('http')
const server = require("http").createServer(app);
const WebSocketServer = require("ws");
const wss = require("socket.io")(server, { cors: { origin: "*" } });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 

app.use(cors())
app.use(express.json())

const SECRET_KEY = "rec_123";
const salt = '$2b$10$3HVhKA2xxrCTEm4BKZ5oM.'

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "TitleDb.db",
    define: {
      timestamps: false
    }
  });

const Post = sequelize.define('Posts', 
{
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    AuthorName: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    TitleName: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    DateOfPublication: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    TitleDescription: {
        type: Sequelize.TEXT,
        allowNull: false
    },
})

const User = sequelize.define('Users', {
  Nickname:{
    type: Sequelize.TEXT,
    allowNull: false,
    primaryKey: true
  },
  Password:{
    type: Sequelize.TEXT,
    allowNull: false
  }
})

app.post("/login", (request, response) => {
  User.findOne({where:{Nickname: request.body.Nickname}})
  .then(data => {
    if (data === null) {
      response.status(404).send('Пользователь не найден');
    } else {
      const isRight = bcrypt.compareSync(request.body.Password, data.Password);
      if (isRight) {
        const token = jwt.sign({ Nickname: request.body.Nickname }, SECRET_KEY);
        response.json({ token, Nickname: request.body.Nickname }); 
      } else {
        response.status(401).send('Неверный пароль');
      }
    }
  }).catch(error => {
    console.error('Ошибка входа:', error);
    response.status(500).send('Ошибка сервера при входе');
  });
});

app.post("/reg", (request, response) => {
  User.findOne({where:{Nickname: request.body.Nickname}})
  .then(data => {
    if (data === null) {
      const hashedPassword = bcrypt.hashSync(request.body.Password, salt);
      User.create({
        Nickname: request.body.Nickname,
        Password: hashedPassword
      }).then(user => {
        const token = jwt.sign({ Nickname: user.Nickname }, SECRET_KEY);
        response.json({ token, Nickname: user.Nickname }); 
      });
    } else {
      response.status(409).send('Пользователь уже существует');
    }
  }).catch(error => {
    console.error('Ошибка регистрации:', error);
    response.status(500).send('Ошибка сервера при регистрации');
  });
});

  app.get("/", function(request, response){
    Post.findAll({ raw: true }).then(posts => {
        response.send(posts)
    }); 
})



app.post("/", function(request, response) {
    Post.create({
      AuthorName: request.body.AuthorName,
      TitleName: request.body.TitleName,
      DateOfPublication: request.body.DateOfPublication,
      TitleDescription: request.body.TitleDescription
    })
    .then(post => {
      response.status(201).json(post);
    })
    .catch(error => {
      console.error("Ошибка добавления записи: ", error);
      response.status(500).send();
    });
  });
  

app.put("/:id",  function(request, response){
  const recId = request.params.id;
  
  Post.update({ 
    AuthorName: request.body.AuthorName,
    TitleName: request.body.TitleName,
    DateOfPublication: request.body.DateOfPublication,
    TitleDescription: request.body.TitleDescription
  }, {
      where: {
          id: recId
      }
  })
  .then(post=> {
    response.status(201).json(post);
  })
  .catch(error => {
      console.error('Ошибка обновления записи:', error);
      response.status(500).send();
  });
});

app.delete("/:id",  function(request, response){
    const recId = request.params.id;
    Post.destroy({
      where: {
        id: recId
      }
    })
    .then(() => {
      response.status(204).send();
    })
    .catch(error => {
      console.error('Ошибка удаления записи:', error);
      response.status(500).send();
    });
  });
  
  app.delete("/",  function(request, response){
    Post.destroy({ where: {} })
      .then(() => {
        response.status(204).send();
      })
      .catch(error => {
        console.error('Ошибка очищения списка записей:', error);
        response.status(500).send();
      });
  });

  console.log("WebSocket-сервер работает на порту 3050");
console.log("Ожидание подключений клиентов...");
wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
      console.log("Received:", message);

      switch (message.event) {
          case "message":
              broadCastMessage(message);
              break;
          case "connection":
              ws.emit("message", { event: "message", data: "Привет, клиент!" });
              break;
      }
  });

  ws.send(JSON.stringify({ event: "message", data: "Привет, клиент!" }));
});

function broadCastMessage(message) {
  wss.emit("message", message);
}

app.get("/", (req, res) => res.send("Hello world"));

  server.listen(4433);
  