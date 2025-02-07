
require('dotenv').config(); // Load environment variables
const bcrypt = require('bcrypt');
const express = require('express');
const { MongoClient } = require('mongodb'); // Use MongoDB native driver
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const { name } = require('ejs');

const app = express();
let db; // Placeholder for the database connection
const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(methodOverride('_method'));

// MongoDB Atlas connection
const uri = "mongodb+srv://ed24b064:Shahid015@cluster0.n5zlu.mongodb.net/"
const client = new MongoClient(uri);

// Function to connect to the database
async function connectDb(callback) {
    try {
        await client.connect();
        db = client.db(); // Use the default database from the connection string
        console.log('Connected to MongoDB Atlas');
        callback(null);
    } catch (err) {
        console.error('Failed to connect to MongoDB Atlas:', err);
        callback(err);
    }
}

// Routes
app.get('/', (req, res) => { res.render('home'); });

app.get('/add', (req, res) => { res.render('add'); });

app.get('/search', (req, res) => { res.render('search'); });

app.get('/delete', (req, res) => { res.render('delete'); });

app.get('/everyone', (req, res) => {
    db.collection('birthday')
        .find({})
        .toArray()
        .then((everyone) => {
            res.render('everyone', { everyone: everyone });
        })
        .catch((err) => {
            res.status(500).json({ error: 'Could not fetch documents' });
        });
});

// Connect to the database and start the server
connectDb(err => {
    if (!err) {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } else {
        console.error('Unable to start server. Database connection failed.');
    }
});

app.post('/search',urlencodedParser, (req, res)=> {
    var name = req.body.name;
    if(!name){
        res.status(500).json({error : 'name is required'})
        return;
    }
    db.collection('birthday')
    .findOne({name : name})
    .then(doc => {
        if(!doc){
            res.status(404).json({error : 'file not found'})
            return;
        }
        res.render('found' , { 'data' : doc});
    })
    .catch(err => {
        res.status(500).json({error : 'file cant be found'});
    })
})



app.post('/add', urlencodedParser, (req, res) => {
    var data = req.body;
    console.log('Received data:', data);
    var name = req.body.name;
    var bday=req.body.bday;
    
    if (!data.name || !data.bday) {
        res.status(500).json({ error: 'All fields are required' });
        return;
    }
    db.collection('birthday')
        .findOne({ name: name, bday: bday })
        .then(doc => {
            if (doc) {res.render('exists');
                return;
            }

    db.collection('birthday')
        .insertOne({ "name": data.name, "bday": data.bday })
        .then(() => {
            res.render('successful');
        })
        .catch(err => {
            console.log('Error inserting data:', err); 
            res.render('fail');
        });
})});

app.post('/delete', urlencodedParser, (req, res) => {
    var data = req.body;
    if(!data.name || !data.bday){
        res.status(500).json({error : 'all the fields are required'})
    }
    db.collection('birthday')
       .deleteOne({"name" : data.name, "bday" : data.bday}).then(()=>{
        res.render('successful')
    })
    .catch(err => {
        res.render('fail');
    })
} )


app.get('/closest-birthday', async (req, res) => {
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1; 
        const currentDate = today.getDate();

        const birthdays = await db.collection('birthday').find({}).toArray();

        if (!birthdays.length) {
            res.status(404).json({ message: 'No birthdays found in the database.' });
            return;
        }

        const daysToNextBirthday = birthdays.map(entry => {
            const [day, month] = entry.bday.split('-').map(Number); 
            const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);

            if (birthdayThisYear < today) {
                birthdayThisYear.setFullYear(today.getFullYear() + 1); 
            }

            const diffInTime = birthdayThisYear - today;
            const diffInDays = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));

            return { 
                name: entry.name, 
                bday: entry.bday, 
                daysUntil: diffInDays 
            };
        });

        const closestBirthday = daysToNextBirthday.reduce((prev, curr) =>
            prev.daysUntil < curr.daysUntil ? prev : curr
        );

        res.render('closestBirthday',{closestBirthday : closestBirthday});
    } catch (error) {
        console.error('Error finding closest birthday:', error);
        res.status(500).json({ error: 'An error occurred while finding the closest birthday.' });
    }
});
