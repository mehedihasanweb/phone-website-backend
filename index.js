const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT;

// middleware
app.use(cors());
app.use(express.json());

function createToken(user) {
  const token = jwt.sign({ email: user?.email }, "secret", { expiresIn: "7d" });
  return token;
}

function verifyToken(req, res, next) {
  const token = req?.headers?.authorization.split(" ")[1];
  const verify = jwt.verify(token, "secret");
  console.log(verify);
  if (!verify?.email) {
    return res.send("You are not authorized");
  }
  req.user = verify?.email;
  next();
}

const uri = process.env.DATABASE_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const productDB = client.db("productDB").collection("product_collection");
    const usersDB = client.db("usersDB").collection("users_collection");

    // phones
    app.post("/phones", verifyToken, async (req, res) => {
      const productData = req.body;
      const result = await productDB.insertOne(productData);
      res.send(result);
    });

    app.get("/phones", async (req, res) => {
      const result = await productDB.find().toArray();
      res.send(result);
    });

    app.get("/phones/:id", async (req, res) => {
      const id = req.params.id;
      const result = await productDB.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch("/phones/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;

      const result = await productDB.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    app.delete("/phones/:id", async (req, res) => {
      const id = req.params.id;

      const result = await productDB.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    // users
    app.post("/user", async (req, res) => {
      const user = req.body;
      const token = createToken(user);

      const existUser = await usersDB.findOne({ email: user?.email });

      if (existUser?._id) {
        return res.send({
          status: "success",
          message: "login success",
          token,
        });
      }
      await usersDB.insertOne(user);
      res.send({ token });
    });

    app.get("/user/update/:id", async (req, res) => {
      const id = req.params.id;
      const user = await usersDB.findOne({ _id: new ObjectId(id) });
      res.send(user);
    });

    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = await usersDB.findOne({ email });
      res.send(user);
    });

    app.patch("/user/:email", async (req, res) => {
      const updateUser = req.body;
      const email = req.params.email;
      const result = await usersDB.updateOne(
        { email },
        { $set: updateUser },
        { upsert: true }
      );
      res.send(result);
    });

    console.log("You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(port, () => {
  console.log("Phone server is running on port :", port);
});
