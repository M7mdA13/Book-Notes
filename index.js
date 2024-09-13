//import npm packages and dependancies
import pg from "pg";
import express from "express";
import bodyParser from "body-parser";
//init express and store port n
const app = express();
const port = 3000;
//MiddleWare
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
//init database
const db = new pg.Client({
  user: "postgres",
  password: "mido2004",
  host: "localhost",
  port: 5432,
  database: "books",
});
db.connect();
//get request for homepage
let sort = '"ratingSort"';
app.get("/", async (req, res) => {
  try {
    const posts = await getPosts(sort);
    res.render("index.ejs", { posts: posts });
  } catch (error) {
    res.render("index.ejs", { error: "Error fetching posts" });
  }
});
// sort posts
app.post("/sort", async (req, res) => {
  sort = JSON.stringify(req.body.sort);
  res.redirect("/");
});
//get request for new post page
app.get("/new", async (req, res) => {
  res.render("new.ejs");
});
// post request for new post
app.post("/new", async (req, res) => {
  try {
    const date = await getDate();
    const title = req.body.title;
    const author = req.body.author;
    const body = req.body.body;
    const isbn = req.body.isbn;
    const rating = req.body.rating;
    await db.query(
      "INSERT INTO posts (title,author,body,isbn,rating,date_created) VALUES ($1,$2,$3,$4,$5,$6)",
      [title, author, body, isbn, rating, date]
    );
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.json("Couldn't Create Post");
  }
});
//send user edit page by clicking edit button on a post
app.get("/posts/edit/:id", async (req, res) => {
  try {
    let post = [];
    const postId = req.params.id;
    const response = await db.query("SELECT * FROM posts WHERE id =$1", [
      postId,
    ]);
    response.rows.forEach((p) => {
      post.push(p);
    });
    res.render("new.ejs", { post: post });
  } catch (err) {
    console.log(err);
    res.redirect("/");
  }
});
//patch a post
app.post("/posts/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const date = await getDate();
    const title = req.body.title;
    const author = req.body.author;
    const body = req.body.body;
    const isbn = req.body.isbn;
    const rating = req.body.rating;
    await db.query(
      "UPDATE posts SET title=$1,body=$2,author=$3,date_created=$4,isbn=$5,rating=$6  WHERE id = $7",
      [title, body, author, date, isbn, rating, id]
    );
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});
// delete a post
app.get("/posts/delete/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    await db.query("DELETE FROM posts WHERE id = $1", [postId]);
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});
// Send user notes page for a specific post (id)
app.get("/posts/:id", async (req, res) => {
  try {
    let post = [];
    const postId = req.params.id;
    const result = await db.query(
      "SELECT * FROM notes JOIN posts ON notes.book_id = posts.id WHERE book_id  = $1",
      [postId]
    );
    
    if ((result.rows.length === 0)) {
      const result = await db.query("SELECT * FROM posts WHERE id = $1", [
        postId,
      ]);
      result.rows.forEach((p) => {
        post.push(p);
      });
    } else {
      result.rows.forEach((p) => {
        post.push(p);
      });
    }
    // console.log(post);
    res.render("notes.ejs", { notes: post });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});
// add new note to a book
app.post("/notes/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const qoute = req.body.qoute;
    const note = req.body.note;
    const auth = req.body.auth;
    await db.query(
      "INSERT INTO notes (book_id,qoute,note,auth) VALUES ($1,$2,$3,$4)",
      [postId, qoute, note, auth]
    );
    res.redirect("/posts/" + req.params.id);
  } catch (error) {
    console.log(error);
    res.redirect("/posts/" + req.params.id);
  }
});
// delete note from book
app.get("/posts/delete/:id/:note_id", async (req,res)=>{
  const postId = req.params.id;
  const noteId = req.params.note_id;
  try{
    await db.query("DELETE FROM notes WHERE note_id = $1",[noteId]);
    res.redirect("/posts/"+postId);
  } catch (error){
    console.log(error);
    res.redirect("/posts/"+postId);
  }
});

//listen on port 3000
app.listen(port, () => {
  console.log("Server is up & running on port " + port);
});

//get current date function
async function getDate() {
  let currentDate = [];
  const date = await db.query("SELECT CURRENT_DATE +0;");
  date.rows.forEach((date) => {
    currentDate = date["?column?"];
  });
  return currentDate;
}
//function to get posts array
async function getPosts(sort) {
  let posts = [];
  if (sort == '"ratingSort"') {
    const result = await db.query("SELECT * FROM posts ORDER BY rating DESC;");
    result.rows.forEach((post) => {
      posts.push(post);
    });
  } else if (sort === '"titleSort"') {
    const result = await db.query("SELECT * FROM posts ORDER BY title ASC;");
    result.rows.forEach((post) => {
      posts.push(post);
    });
  } else if (sort == '"dateSort"') {
    const result = await db.query(
      "SELECT * FROM posts ORDER BY date_created DESC;"
    );
    result.rows.forEach((post) => {
      posts.push(post);
    });
  }
  return posts;
}
