var express = require('express');
var controller = express.Router();

var mysql = require('mysql');
var app = express();
//var searchResult = require('/searchResult');
const bodyParser = require('body-parser');

app.use(express.static('public'));
//app.use(app.router);
app.set('view engine', 'jade');
app.use(bodyParser.urlencoded({ extended: true }));
//app.get('/searchResult', searchResult.list);

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Samidha@10392",
    database: "library_db"
});
//app.use(bodyParser.urlencoded({ extended: false }));

/*
app.get('/', function (req, res) {
    res.sendFile('C:/Users/lenovo/Desktop/nilu/UTD course materials/Database Design/LibraryManagement/bookSearch.html');
});
*/

//app.post('/submit-student-data', function (req, res) {
  //  var name = req.body.firstName + ' ' + req.body.lastName;

    //res.send(name + ' Submitted Successfully!');
//});
app.get('/', function (req, res) {
    res.render('index');
});

app.get('/newAccount', function (req, res) {
    res.render('index');
});
app.get('/createNewAccount', function (req, res) {
    res.render('index');
});
app.get('/search_book', function (req, res) {
    res.render('index');
});
app.get('/issue_book', function (req, res) {
    res.render('index');
});
app.get('/check_in', function (req, res) {
    res.render('index');
});
app.get('/checkFines', function (req, res) {
    res.render('index');
});

app.get('/payfine', function (req, res) {
    console.log("in GET update!!");
    console.log(" loan_id " + req.query.loan_id);
    fineloanid = req.query.loan_id;
    console.log("fineloanid    "+fineloanid);
    var fineq = 'update fines set paid=TRUE where Loan_id = ?';
    con.query(fineq, [fineloanid], function (err, result, fields) {
        if (err) throw err;

        res.send("Fine for that book paid! Thank you! ");
    });
});

app.get('/update', function (req, res) {
    console.log("in GET update!!");
    console.log(" loan_id " + req.query.Loan_id);
    checkinloanid= req.query.Loan_id;
    /*
    var db = req.db;
    var locals = {};
    console.log(req.params); return;
    locals.Jobcardnumber = req.body.Loan_id;
    console(Jobcardnumber);
    res.send(req.Loan_id);
    */
    var checkin = 'update BOOK_LOANS set Date_in=curdate() where Loan_id = ?';
    con.query(checkin, [checkinloanid], function(err, result, fields) {
        if (err) throw err;

        ////calculate fine to insert in fines table
        if(checkinloanid){
            console.log("in if condition of calculate fine");
            var insertintofine= 'insert into fines (loan_id, Fine_amt, Paid) values (?, 0, FALSE)';
            con.query(insertintofine, [checkinloanid], function(err, rows, fields) {
                if (err) throw err;
                console.log("insert into fine");
            });
            var calculateFine = 'update fines set fine_amt = (select (DATEDIFF(curdate(), due_date))*0.25 as fineAmt from book_loans where Loan_id = ? AND curdate() > due_date) where loan_id = ?';
            con.query(calculateFine, [checkinloanid, checkinloanid], function(err, rows, fields) {
                if (err) throw err;
                console.log(" Calculated fine is updated in Fines Table ");
            });
        }

        /////

        /////insert calculated fine in fine table


        /////
        res.send(" Successfully submitted a book! Thank you! ");
    });



    var updateFine = 'INSERT INTO FINES(Loan_id,Fine_amt,Paid) values (?, ) where Loan_id = ?';

});
app.post('/search-book-availability', function (req, res) {
    var BookSearchByWord = req.body.bookSearch;


    con.connect(function(err) {
        if (err) throw err;
        con.query("SELECT * FROM Author", function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            res.send(' Search Result ' + result.toString() );
        });
    });
});

app.post('/search_book', function (req, res){

    //res.render('index');
    con.connect(function(err) {
        var searchby = ("%" + req.body.Searchbyword + "%");
        console.log(req.body.Searchbyword);
        if (err) throw err;
        var sql = 'select ISBN10, title, author from books where title like ? OR author like ? ';
        //console.log(" searchby " + searchby);

        con.query(sql, [searchby, searchby], function(err, rows, fields) {
            if (err) throw err;
            console.log(rows);
            res.render('rooms', {
                rows: rows
            });
            //res.render('testtable',{page_title:"Test Table",data:rows});
            //res.render('searchResult',{page_title:"Test Table",data:rows});
        });
    });
});

app.post('/issue_book', function (req, res){
    var isbn = req.body.ISBNToIssue;
    let card = req.body.cardnumber;
    //if(card == null || card == ''){

    //}
    //res.render('index');
    con.connect(function(err) {

        console.log( "card number " + card);
        if (err) throw err;

        var checkbooksIssued = 'select * from Book_loans where date_in IS NULL and card_id = ? ';
        con.query(checkbooksIssued, [card], function(err, result, fields) {
            if (err) throw err;
            console.log("Row count : " + result.length);
            var booksIssued = result.length; //result.affectedrows for update/delete query
            if(booksIssued >= 3){ // Check if borrower has 3 book loans
                console.log(" You cannot issue more than 3 books! ");
                res.send(" Oops ! You have already issued 3 books! ");
            }
            else{ // Checkout a book and insert details in the table
                console.log("in else loop");

                var   checkbookAvailabality = 'SELECT * FROM BOOK_LOANS WHERE ISBN = ? AND DATE_IN IS NULL';
                con.query(checkbookAvailabality, [isbn], function(err, result, fields){
                    if (err) throw err;
                    console.log("Row count : " + result.length);
                    const availabilitystatus  = result.length;
                    if(availabilitystatus > 0){
                        res.send(" Sorry! This book is currently unavailable! You can always check available books from book search! ");
                    }else{
                        console.log(" in else book available");

                        var insertintoloan = 'insert into book_loans (ISBN, card_id, Date_out, Due_date, Date_in) values(?, ?, curdate(), date_add(curdate(), INTERVAL 14 DAY), NULL)';
                        con.query(insertintoloan, [isbn, card], function(err, result, fields) {
                            if (err) throw err;
                            res.send(" Successfully issued a book! Keep Reading! ");
                        });
                    }

                });

            };
        });
    });
});

app.post('/check_in', function (req, res){
    var checkinbookby = (req.body.checkinbook);

    //if(checkinbookby !== null || checkinbookby !== ''){ ///////newly added
       // res.send("Please enter ISBN or Card Id");
    //}else {
        con.connect(function (err) {

            console.log(req.body.Searchbyword);
            if (err) throw err;

            var sql = 'select * from book_loans where Date_in IS NULL AND (book_loans.ISBN = ? OR book_loans.card_id = ?)';
            //console.log(" searchby " + searchby);

            con.query(sql, [checkinbookby, checkinbookby], function (err, rows, fields) {
                if (err) throw err;
                console.log(rows);
                res.render('checkInBook', {
                    rows: rows
                });
                //res.render('testtable',{page_title:"Test Table",data:rows});
                //res.render('searchResult',{page_title:"Test Table",data:rows});
            });
        });
    //};/////
});

app.post('/newAccount', function (req, res) {
    res.render('createAccount');
});
app.post('/createNewAccount', function (req, res){
    console.log("in createNewAccount");
    //res.render('index');
    con.connect(function(err) {
        var ssn = req.body.ssn;
        var first_name = req.body.first_name;
        var last_name = req.body.last_name;
        var email = req.body.email;
        var address = req.body.address;
        var city =  req.body.city;
        var state = req.body.state;

        if (err) throw err;

        //Check if entered SSN already exists
        var checkSSNExists = 'select * from borrower where ssn = ?' ;
        con.query(checkSSNExists, [ssn], function(err, result, fields) {
            if (err) throw err;
            console.log(result);
            var ssnpresent = result.length;
            if(ssnpresent > 0){
                res.send("SSN entered already exists!! Please enter valid SSN");
            }
            else{
                var sql = 'INSERT INTO BORROWER (ssn, first_name, last_name, email, address, city, state) VALUES (?,?,?,?,?,?,?) ';
                con.query(sql, [ssn, first_name, last_name, email, address, city, state], function(err, rows, fields) {
                    if (err) throw err;
                    console.log(rows);
                });
            }
        });
    });
});

//Check Fines
app.post('/checkFines', function (req, res) {
    console.log("in check fines");
    var borroweridfine = req.body.borroweridfine;
    var sql = 'select bl.loan_id, bl.isbn, f.fine_amt from book_loans bl INNER JOIN FINES f ON bl.loan_id=f.loan_id where bl.Card_id = ? and f.fine_amt is not null and f.paid = FALSE';
    con.query(sql, [borroweridfine], function(err, rows, fields) {
        if (err) throw err;
        console.log(rows);
        res.render('checkfines', {
            rows: rows
        });
    });
});
app.post('/update', function (req, res) {
    console.log("in update");
});

var server = app.listen(5000, function () {
    console.log('Node server is running..');
});
