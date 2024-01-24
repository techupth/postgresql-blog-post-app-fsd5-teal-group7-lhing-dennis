import { Router } from "express";
import { connectionPool } from "../utils/db.js";

const postRouter = Router();

postRouter.get("/", async (req, res) => {
  const status = req.query.status || ""; // status ที่รับจาก client
  const keywords = req.query.keywords || "";
  const page = req.query.page || 1;

  const PAGE_SIZE = 5;
  const offset = (page - 1) * PAGE_SIZE;

  // logic ในการแสดงผลข้อมูลโพสต์ทั้งหมด
  let query = "";
  let values = [];
  // กรณีที่ 1 มีการระบุ status และ keyword
  // กรณีที่ 2 มีการระบุแค่ keyword
  // กรณีที่ 3 มีการระบุแค่ status
  // กรณีที่ 4 ไม่มีการระบุอะไร
  if (status && keywords) {
    query =
      "select * from posts where status=$1 and title ilike $2 limit $3 offset $4";
    values = [status, keywords, PAGE_SIZE, offset];
  } else if (keywords) {
    query = "select * from posts where title ilike $1 limit $2 offset $3"; // ilike เป็นการเทียบค่าว่า title ตรงกับ req ส่งมาหรือไม่
    values = [keywords, PAGE_SIZE, offset];
  } else if (status) {
    query = "select * from posts where status=$1 limit $2 offset $3";
    values = [status, PAGE_SIZE, offset];
  } else {
    query = "select * from posts limit $1 offset $2";
    values = [PAGE_SIZE, offset];
  }
  try {
    const result = await connectionPool.query(query, values);
    return res.json({
      data: result.rows,
    });
  } catch (error) {
    return res.json({ message: Error`${error}` });
  }
});

postRouter.get("/:id", async (req, res) => {
  const postId = req.params.id; // parameter ที่ client ส่งเข้ามา
  try {
    const result = await connectionPool.query(
      "select * from posts where post_id=$1", // $1 จะถูกแทนที่ด้วยข้อมูล postId ที่ส่งมาจาก client
      [postId]
    );
    return res.json({
      data: result.rows[0],
    });
  } catch (error) {
    return res.json({ message: Error`${error}` });
  }
});

postRouter.post("/", async (req, res) => {
  const hasPublished = req.body.status === "published";
  // ข้อมูลจาก client
  const newPost = {
    ...req.body,
    created_at: new Date(), // สิ่งที่เราต้องการ add เข้าไป นอกเหนือจากที่ client ส่งมา
    updated_at: new Date(),
    published_at: hasPublished ? new Date() : null,
  };
  try {
    await connectionPool.query(
      "insert into posts(title,content,status,category,created_at,updated_at,published_at) value($1,$2,$3,$4,$5,$6,$7)",
      [
        newPost.title,
        newPost.content,
        newPost.status,
        newPost.category,
        newPost.created_at,
        newPost.updated_at,
        newPost.published_at,
      ]
    );
    return res.json({
      message: "Post has been created.",
    });
  } catch (error) {
    return res.json({ message: Error`${error}` });
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
    await connectionPool.query(
      "update posts set title=$1,content=$2,status=$3,category=$4,updated_at=$5,published_at=$6 where post_id=$7",
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
    });
  } catch (error) {
    return res.json({ message: Error`${error}` });
  }
});

postRouter.delete("/:id", async (req, res) => {
  const postId = req.params.id;
  try {
    await connectionPool.query("delete from posts where post_id=$1", [postId]);
    return res.json({
      message: `Post ${postId} has been deleted.`,
    });
  } catch (error) {
    return res.json({ message: Error`${error}` });
  }
});

export default postRouter;
