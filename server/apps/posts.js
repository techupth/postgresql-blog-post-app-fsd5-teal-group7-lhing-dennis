import { Router } from "express";
import { pool } from "../utils/db.js";

const postRouter = Router();

postRouter.get("/", async (req, res) => {
  const status = req.query.status;
  const keywords = `%${req.query.keywords}%`;
  const page = +req.query.page || 1;
  const limit = 5;
  const skip = (page - 1) * 5;

  let query = "";
  let values = [];
  let totalPageQuery = "";
  let totalPageValues = [];
  if (status && keywords) {
    query = `select * from posts
    where status=$1
    and title ilike $2
    limit $3
    offset $4`;
    values = [status, keywords, limit, skip];
    //
    totalPageQuery = `select * from posts
    where status=$1
    and title ilike $2`;
    totalPageValues = [status, keywords];
  } else if (keywords) {
    query = `select * from posts
    where title ilike $1
    limit $2
    offset $3`;
    values = [keywords, limit, skip];
    totalPageQuery = `select * from posts
    where title ilike $1`;
    totalPageValues = [keywords];
  } else if (status) {
    query = `select * from posts
    where status=$1
    limit $2
    offset $3`;
    values = [status, limit, skip];
    totalPageQuery = `select * from posts
    where status=$1`;
    totalPageValues = [status];
  } else {
    query = `select * from posts
    limit $1
    offset $2`;
    values = [limit, skip];
    totalPageQuery = `select * from posts`;
    totalPageValues = [];
  }

  try {
    const total_pages = await pool.query(totalPageQuery, totalPageValues);
    const results = await pool.query(query, values);
    return res.json({
      data: [...results.rows],
      total_pages: Math.ceil(total_pages.rows.length / limit),
    });
  } catch {
    return res.status(500).json({
      message: "Server error",
    });
  }
});

postRouter.get("/:id", async (req, res) => {
  const postId = req.params.id;
  try {
    const result = await pool.query(`select * from posts where post_id=$1`, [
      postId,
    ]);
    return res.json({
      message: "Fetching Successfully",
      data: { ...result.rows[0] },
    });
  } catch (err) {
    return res.json({ message: "Fetching error", err });
  }
});

postRouter.post("/", async (req, res) => {
  const hasPublished = req.body.status === "published";
  const newPost = {
    ...req.body,
    created_at: new Date(),
    updated_at: new Date(),
    published_at: hasPublished ? new Date() : null,
  };
  try {
    const post = await pool.query(
      `insert into posts(title, content, status, created_at, updated_at, published_at, likes, category) values($1,$2,$3,$4,$5,$6,$7,$8)`,
      [...Object.keys(newPost).map((item) => newPost[item]), 0, "eiei"]
    );

    return res.json({
      message: "Post has been created.",
    });
  } catch (err) {
    res.json({
      message: "Cannot create a new post",
      err,
    });
  }
});

postRouter.put("/:id", async (req, res) => {
  const hasPublished = req.body.status === "published";

  const updatedPost = {
    ...req.body,
    updated_at: new Date(),
    published_at: hasPublished ? new Date() : null,
  };
  const postId = req.params.id;
  try {
    const result = await pool.query(
      `update posts set title=$1, content=$2, status=$3, category=$4, updated_at=$5, published_at=$6 where post_id = $7 returning *`,
      [
        updatedPost.title,
        updatedPost.content,
        updatedPost.status,
        updatedPost.category,
        updatedPost.updated_at,
        updatedPost.published_at,
        postId,
      ]
    );

    return res.json({
      message: `Post ${postId} has been updated.`,
      data: result.rows[0],
    });
  } catch (err) {
    return res.json({ message: "Cannot update the post", err });
  }
});

postRouter.delete("/:id", async (req, res) => {
  const postId = req.params.id;
  try {
    const deleted = await pool.query(`delete from posts where post_id=$1`, [
      postId,
    ]);
    return res.json({
      message: `Post ${postId} has been deleted.`,
    });
  } catch (err) {
    return res.json({
      message: `Post ${postId} cannot be been deleted.`,
      err,
    });
  }
});

export default postRouter;
