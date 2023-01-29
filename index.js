const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { graphqlUploadExpress } = require('graphql-upload');
const typeDefs = require('./gql/schema');
const resolvers = require('./gql/resolvers');

require('dotenv').config({ path: '.env' });

const config = {
    application: {
        cors: {
            server: [
                {
                    origin: process.env.PORT || 4000,
                    credentials: true
                }
            ]
        }
    }
}


mongoose.connect(process.env.mongo_uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}, (err, _) => {
    if (err) {
        console.log(err);
    } else {
        console.log('DATABAS3 CONNECTED !!!!');
        server();
    }
});



async function server(){
    const serverApollo = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }) => {
            const token = req.headers.authorization;
            if(token){
                try {
                    const user = jwt.verify(
                        token.replace('Bearer ', ''),
                        process.env.SECRET_KEY
                    );
                    return {
                        user,
                    }
                } catch (err) {
                    console.log('########### ERROR ###########');
                    console.log(err);
                    throw new Error('Invalid Token');
                }
            }
        }
    });

    await serverApollo.start();
    const app = express();

    app.use(cors(
        config.application.cors.server
    ));

    app.use(graphqlUploadExpress());
    serverApollo.applyMiddleware({ app });
    await new Promise((r) => app.listen({
        port: process.env.PORT || 5000
    }, r));

    console.log(`Server ready at http://localhost:${process.env.PORT}${serverApollo.graphqlPath}`);
}

