// ============================================================
// aggregations.js —— 任务四：A1~A9 聚合管道
// ============================================================

print("========== A1 按类别统计数量与平均评分 ==========");
db.books.aggregate([
  {$group:{_id:"$category", count:{$sum:1}, avgRating:{$avg:"$rating"}}},
  {$sort:{count:-1}}
]).forEach(d=>printjson(d));

print("\n========== A2 出版社 Top5 ==========");
db.books.aggregate([
  {$group:{_id:"$publisher", count:{$sum:1}}},
  {$sort:{count:-1}}, {$limit:5}
]).forEach(d=>printjson(d));

print("\n========== A3 图书最多的类别（$sortByCount） ==========");
db.books.aggregate([{$sortByCount:"$category"}]).forEach(d=>printjson(d));

print("\n========== A4 评分 Top3（书名+借阅次数） ==========");
db.books.aggregate([
  {$sort:{rating:-1}}, {$limit:3},
  {$project:{_id:0, title:1, borrow_count:1, rating:1}}
]).forEach(d=>printjson(d));

print("\n========== A5 销售额 = price × borrow_count（前 3） ==========");
db.books.aggregate([
  {$project:{_id:0, title:1, sales:{$round:[{$multiply:["$price","$borrow_count"]},2]}}},
  {$sort:{sales:-1}}, {$limit:3}
]).forEach(d=>printjson(d));

print("\n========== A6 按年份统计借阅量 ==========");
db.borrow_logs.aggregate([
  {$group:{_id:{$dateToString:{format:"%Y年", date:"$borrow_date"}}, count:{$sum:1}}},
  {$sort:{_id:1}}
]).forEach(d=>printjson(d));

print("\n========== A7 活跃读者 Top5 ==========");
db.borrow_logs.aggregate([
  {$group:{_id:"$reader_card", cnt:{$sum:1}}},
  {$sort:{cnt:-1}}, {$limit:5}
]).forEach(d=>printjson(d));

print("\n========== A8 学院借阅量排行（$lookup） ==========");
db.readers.aggregate([
  {$lookup:{from:"borrow_logs", localField:"card_no", foreignField:"reader_card", as:"logs"}},
  {$group:{_id:"$college", borrowCount:{$sum:{$size:"$logs"}}}},
  {$sort:{borrowCount:-1}}
]).forEach(d=>printjson(d));

print("\n========== A9 把 A1 结果 $merge 到 category_stats ==========");
db.books.aggregate([
  {$group:{_id:"$category", count:{$sum:1}, avgRating:{$avg:"$rating"}}},
  {$merge:{into:"category_stats", whenMatched:"replace", whenNotMatched:"insert"}}
]);
print("category_stats 当前文档数：", db.category_stats.countDocuments());
db.category_stats.find().forEach(d=>printjson(d));
