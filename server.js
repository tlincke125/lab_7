const express = require('express'); // Add the express framework has been added
let app = express();

const bodyParser = require('body-parser'); // Add the body-parser tool has been added
app.use(bodyParser.json()); // Add support for JSON encoded bodies
app.use(bodyParser.urlencoded({
    extended: true
})); // Add support for URL encoded bodies

const pug = require('pug'); // Add the 'pug' view engine

//Create Database Connection
const pgp = require('pg-promise')();



const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'football_db',
    user: 'postgres',
    password: 'notarealpassword'
};

let db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/')); // This line is necessary for us to use relative paths and access our resources directory


// login page 
app.get('/login', function(req, res) {
    res.render('pages/login', {
        local_css: "signin.css",
        my_title: "Login Page"
    });
});

// registration page 
app.get('/register', function(req, res) {
    res.render('pages/register', {
        my_title: "Registration Page"
    });
});

app.get('/home', function(req, res) {
    var query = 'select * from favorite_colors;';
    db.any(query)
        .then(function(rows) {
            res.render('pages/home', {
                my_title: "Home Page",
                data: rows,
                color: '',
                color_msg: ''
            })

        })
        .catch(function(err) {
            // display error message in case an error
            req.flash('error', err); //if this doesn't work for you replace with console.log
            res.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
        })
});

function prettyDate(dateString){
    //if it's already a date object and not a string you don't need this line:
    var date = new Date(dateString);
    var d = date.getDate();
    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun",
"Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
    var m = monthNames[date.getMonth()];
    var y = date.getFullYear();
    return d+' '+m+' '+y;
}

app.get('/home/pick_color', function(req, res) {
    var color_choice = req.query.color_selection;
    var color_options = 'select * from favorite_colors;';
    var color_message = "select color_msg from favorite_colors where hex_value = '" + color_choice + "';";
    db.task('get-everything', task => {
            return task.batch([
                task.any(color_options),
                task.any(color_message)
            ]);
        })
        .then(info => {
            res.render('pages/home', {
                my_title: "Home Page",
                data: info[0],
                color: color_choice,
                color_msg: info[1][0].color_msg
            })
        })
        .catch(error => {
            // display error message in case an error
            req.flash('error', error); //if this doesn't work for you replace with console.log
            res.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
        });

});

app.post('/home/pick_color', function(req, res) {
    var color_hex = req.body.color_hex;
    var color_name = req.body.color_name;
    var color_message = req.body.color_message;
    var insert_statement = "INSERT INTO favorite_colors(hex_value, name, color_msg) VALUES('" + color_hex + "','" +
        color_name + "','" + color_message + "') ON CONFLICT DO NOTHING;";

    var color_select = 'select * from favorite_colors;';
    db.task('get-everything', task => {
            return task.batch([
                task.any(insert_statement),
                task.any(color_select)
            ]);
        })
        .then(info => {
            res.render('pages/home', {
                my_title: "Home Page",
                data: info[1],
                color: color_hex,
                color_msg: color_message
            })
        })
        .catch(error => {
            // display error message in case an error
            req.flash('error', error); //if this doesn't work for you replace with console.log
            res.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
        });
});

app.get('/team_stats', function(req, res) {
    var query_games = "SELECT * FROM football_games;";
    var query_winning = "SELECT COUNT(*) FROM football_games WHERE home_score > visitor_score;";
    var lossing_games = "SELECT COUNT(*) FROM football_games WHERE home_score < visitor_score;";

    db.task('get-everything', task => {
            return task.batch([
                task.any(query_games),
                task.any(query_winning),
                task.any(lossing_games)
            ]);
        })
        .then(data => {
            res.render('pages/team_stats', {
                my_title: "Team Stats",
                games: data[0],
                wins: data[1][0].count,
                losses: data[2][0].count
            })
        })
        .catch(error => {
            // display error message in case an error
            console.log('error', error);
            res.render('pages/team_stats', {
                my_title: "Team Stats",
                games: "this",
                wins: "tat",
                losses: "other"
            })
        });

});


app.get('/player_info', function(req, res) {
  query = "SELECT id, name FROM football_players;";

    db.task('get-everything', task => {
            return task.batch([
                task.any(query),
            ]);
        })
        .then(data => {
            res.render('pages/player_info', {
                my_title: "Player Info",
                players: data[0]
            })
        })
        .catch(error => {
            // display error message in case an error
            console.log('error', error);
            res.render('pages/player_info', {
                my_title: "Player Info",
                players: ""
            })
        });
});

app.get('/player_info/select_player', function(req, res) {
  console.log(req.query.player_choice);
  query2 = `SELECT * FROM football_players WHERE id=${req.query.player_choice};`;
  query1 = "SELECT id, name FROM football_players;";

    db.task('get-everything', task => {
            return task.batch([
                task.any(query1),
                task.any(query2),
            ]);
        })
        .then(data => {
            res.render('pages/player_info', {
                my_title: "Player Info",
                players: data[0],
                player: data[1][0]
            })
  console.log(data[1]);
        })
        .catch(error => {
            // display error message in case an error
            console.log('error', error);
            res.render('pages/player_info', {
                my_title: "Player Info",
                players: "",
                player: ""
            })
        });
});




app.listen(3000);
console.log('3000 is the magic port');
