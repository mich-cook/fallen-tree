import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {
  try {
    const client = await MongoClient.connect('mongodb://localhost:27017', { "useNewUrlParser": true });
    const db = client.db('fallen-tree');

    await operations(db);

    client.close();
  } catch(e) {
    res.status(500).json({ "message": "Error connecting to db", e});
  }
};

app.get('/api/articles/:name', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db.collection('articles').findOne({ "name": articleName });
    res.status(200).json(articleInfo);
  }, res);
});

app.post('/api/articles/:name/upvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;

    const articleInfo = await db.collection('articles').findOne({ "name": articleName });
    await db.collection('articles').updateOne({ "name": articleName }, {
      '$set': {
        "upvotes": articleInfo.upvotes + 1
      }
    });

    const updatedArticleInfo = await db.collection('articles').findOne({ "name": articleName });

    res.status(200).json(updatedArticleInfo);
  }, res);
});

app.post('/api/articles/:name/add-comment', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name;
    const { username, text} = req.body;

    const articleInfo = await db.collection('articles').findOne({ "name": articleName });
    await db.collection('articles').updateOne({ "name": articleName }, {
      '$set': {
        "comments": articleInfo.comments.concat({ username, text })
      }
    });

    const updatedArticleInfo = await db.collection('articles').findOne({ "name": articleName });

    res.status(200).json(updatedArticleInfo);
  
  }, res);
/*
  try {

    res.status(200).json(articleInfo);

    client.close();
  } catch(e) {
    res.status(500).json({ "message": "Error connecting to db", e});
  }

//  articlesInfo[articleName].comments.push({ username, text });

//  res.status(200).send(articlesInfo[articleName]);
*/
});



app.get('/hello', (req, res) => res.send('I hear you - five by five.'));
/*
app.get('/hello/:name', (req, res) => res.send(`Hello ${req.params.name}`));
app.post('/hello', (req, res) => res.send(`Hello ${req.body.name}`));
*/
// until we have npx installed, this is how you start it:
// # nodejs node_modules/@babel/node/bin/babel-node.js src/server.js

// send everything that didn't match above to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on port 8000...'));