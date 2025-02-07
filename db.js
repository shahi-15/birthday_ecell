var { MongoClient }  = require('mongodb');

let dbConnection

module.exports = {
    connectDb : (cb) => {
        MongoClient.connect('mongodb+srv://ed24b064:shahid015%40%23%2A@birthday.2gstp.mongodb.net')
        .then((client) => {
            dbConnection = client.db();
            return cb()
        })
        .catch(err => {
            console.log(err);
            return cb(err)
        })
    },
    getDb : () => dbConnection
}