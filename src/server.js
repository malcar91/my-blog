import express from 'express'
import bodyParser from 'body-parser'
import { MongoClient } from 'mongodb'
// path does not need to be installed because it is already included with Node.js
import path from 'path'

const app = express()

// the build folder created from the front end directory has to be copied to this backend

// where to serve static files, such as images
app.use(express.static(path.join(__dirname, '/build')))
// parses the json that we included with our post request and adds a body to it
app.use(bodyParser.json())

// we are refactoring code here;
// taking care of all the setup and tare down for us
const withDB = async (operations, res) => {
  try {

    const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true })
    const db = client.db('my-blog')

    await operations(db)

    client.close()
  } catch (error) {
      res.status(500).json({ message: 'Error connecting to db', error })
  }
}

// when using `await` inside of the withDB method I then have to add `async` to that same method
app.get('/api/articles/:name', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name

    const articleInfo = await db.collection('articles').findOne({ name: articleName })
    res.status(200).json(articleInfo)
  }, res)
})

app.post('/api/articles/:name/upvote', async (req, res) => {
  withDB(async (db) => {
    const articleName = req.params.name

    const articleInfo = await db.collection('articles').findOne({ name: articleName })
    await db.collection('articles').updateOne({ name: articleName }, {
      '$set': {
        upvotes: articleInfo.upvotes + 1,
      },
    })
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })

    res.status(200).json(updatedArticleInfo)
  }, res)
})

app.post('/api/articles/:name/add-comment', (req, res) => {
  const { username, text } = req.body
  const articleName = req.params.name

  withDB(async (db) => {
    const articleInfo = await db.collection('articles').findOne({ name: articleName })
    await db.collection('articles').updateOne({ name: articleName }, {
      '$set': {
        // `concat` adds something to an array
        comments: articleInfo.comments.concat({ username, text }),
      },
    })
    const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })
    res.status(200).json(updatedArticleInfo)
  }, res)
})

// app.get('/api/articles/:name', async (req, res) => {
//   try {
//     const articleName = req.params.name
//
//     const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true })
//     const db = client.db('my-blog')
//
//     const articleInfo = await db.collection('articles').findOne({ name: articleName })
//     res.status(200).json(articleInfo)
//
//     client.close()
//   } catch (error) {
//       res.status(500).json({ message: 'Error connecting to db', error })
//   }
// })

// app.post('/api/articles/:name/upvote', async (req, res) => {
//   try {
//     const articleName = req.params.name
//
//     const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true })
//     const db = client.db('my-blog')
//
//     const articleInfo = await db.collection('articles').findOne({ name: articleName })
//     await db.collection('articles').updateOne({ name: articleName }, {
//       '$set': {
//         upvotes: articleInfo.upvotes + 1,
//       },
//     })
//     const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName })
//
//     res.status(200).json(updatedArticleInfo)
//
//     client.close()
//   } catch (error) {
//       res.status(500).json({ message: 'Error connecting to db', error })
//     }
// })

// app.post('/api/articles/:name/add-comment', (req, res) => {
//   const { username, text } = req.body
//   const articleName = req.params.name
//
//   articlesInfo[articleName].comments.push({ username, text })
//
//   res.status(200).send(articlesInfo[articleName])
// })

// so this then allowed us to run the backend on localhost 8000
app.get('*', (req, res) => {
  // all requests that are not caught by any other api routes shoiuld be passed onto our app.
  res.sendFile(path.join(__dirname + '/build/index.html'))
})

app.listen(8000, () => console.log('Listening on port 8000'))
