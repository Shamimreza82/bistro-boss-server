const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId, Admin } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken');
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000

//middelwair
app.use(express.json())
app.use(cors())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3n66z7h.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const veryfyToken = (req, res, next) => {
  console.log(" inside veryFi token", req.headers.authorization);
  if(!req.headers.authorization){
   return res.status(401).send({message: "forbiddin Access"})
  } 
    const token = req.headers.authorization.split(' ')[1]; 
    if(!token){
      return  res.status(401).send({message: "forbiddin Access"})
    }
    jwt.verify(token, process.env.ASSESS_TOKEN, (err, decode) => {
        if(err){
          return  res.status(401).send({message: "forbidden Access"})
        }
        req.decoded = decode; 
        next()
    } )
}

/// use verify admin after veriyToken
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email; 
  const query = {email: email} 
  const user = await usersCollection.findOne(query)
  const isAdmin = user?.role === 'admin'
  if(!isAdmin){
    return  res.status(401).send({message: "forbidden Access"})
  }
  next()
}




async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const usersCollection = client.db('bistroDB').collection('users')
    const menuCollection = client.db('bistroDB').collection('menu')
    const reviewsCollection = client.db('bistroDB').collection('reviews')
    const cartsCollection = client.db('bistroDB').collection('carts')


    /// jwt token genarate 
    app.post('/jwt', async (req, res) => {
 
      const user = req.body;
      const token = jwt.sign(user, process.env.ASSESS_TOKEN, {expiresIn: '1h'})
      res.send({token})
    })


    /// users 6related api 

    app.get('/users/admin/:email', veryfyToken, async (req, res) => {
      const email = req.params.email; 
      if(email !== req.decoded.email){
        return res.status(403).send({message: 'unathoriz access'})
      }
      const query = {email: email}
      const user = await usersCollection.findOne(query)
      let admin = false
      if(user){
        admin = user?.role === 'admin'; 
      }
      res.send({admin})
    })




    app.get('/users', veryfyToken, verifyAdmin,  async (req, res) => {

      const result = await usersCollection.find().toArray()
      res.send(result)
    })


    app.post('/users', async (req, res) => {
        const user = req.body; 
        const query = {email: user.email}
        const isExist = await usersCollection.findOne(query)
        if(isExist){
          return res.send({messege: "user alreay existe", insertedId: null})
        }
        const result = await usersCollection.insertOne(user)
        res.send(result)
    })

    app.delete('/users/:id', veryfyToken, verifyAdmin,  async (req, res) => {
      const id = req.params.id; 
      const query = {_id: new ObjectId(id)}
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/users/admin/:id', veryfyToken, verifyAdmin,  async(req, res) => {
      const id = req.params.id; 
      const filter = {_id: new ObjectId(id)}; 
      const updatedDoc = {
        $set: {
          role: "admin"
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })


    /// menu related Api
    app.get('/menu', async (req, res) => {
        const result = await menuCollection.find().toArray()
        res.send(result)
    })

    app.get('/reviews', async (req, res) => {
        const result = await reviewsCollection.find().toArray()
        res.send(result)
    })


    // cartCollection
    app.post('/carts', async (req, res) => {
      const cartItems = req.body; 
      const result = await cartsCollection.insertOne(cartItems)
      res.send(result)
    })

    app.get('/carts', async(req, res) => {
      const email = req.query.email
      const query = {email: email}
      const result = await cartsCollection.find(query).toArray()
      res.send(result)
    })

    app.delete('/carts/:id', async(req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await cartsCollection.deleteOne(query)
      res.send(result);
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send("Boss is sitting")
})

app.listen(port, () => {
    console.log(`Bistro Boss is sitting on Port ${port}`);
})