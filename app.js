const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expressValidator = require("express-validator");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const categoryRoutes = require("./routes/category");
const productRoutes = require("./routes/product");
const braintreeRoutes = require("./routes/braintree");
const orderRoutes = require("./routes/order");
require("dotenv").config();


const app = express();


//swagger documentation
const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUI = require('swagger-ui-express')


const swaggerOptions = {
  swaggerDefinition: {
    info: {
      "title": "Winterly API",
      "description": "This is the node API backend used for Winterly. Documentation under development)",
      "version": "1.0.1",
      // servers: ["http://localhost:3000/api"]
    },
  },
      // apis: ['**/*.js'], 
      apis: ['./controllers/*.js','./models/*.js'], 
      // apis: ['./models/*.js'], 
};


const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/docs',swaggerUI.serve,swaggerUI.setup(swaggerDocs));


// // db
mongoose
  .connect(process.env.DATABASE,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => console.log("Database Is Connected."))
  .catch((error) => {
    console.log(`can not connect to database, ${error}`);
  });

//middleware
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());

//routes middleware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", braintreeRoutes);
app.use("/api", orderRoutes);

const port = process.env.PORT;
app.listen(port, (req, res) => {
  console.log(`Express server running on PORT:${port}`);
});
