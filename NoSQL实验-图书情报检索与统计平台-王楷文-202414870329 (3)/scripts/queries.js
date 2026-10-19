// ============================================================
// queries.js —— 任务三：16 条查询 + 7 条更新删除
// 用法：mongosh library -u libWriter -p --authenticationDatabase admin
//       load("/home/user/student/queries.js")
// ============================================================

print("========== 基础检索 Q1~Q6 ==========");
print("Q1  价格>80 元：              ", db.books.countDocuments({price:{$gt:80}}));
print("Q2  库存<10 本：               ", db.books.countDocuments({stock:{$lt:10}}));
print("Q3  ISBN=9787115428028：       ", db.books.countDocuments({isbn:"9787115428028"}));
print("Q4  email 为空的读者：         ", db.readers.countDocuments({email:null}));
print("Q5  非人民邮电出版社：         ", db.books.countDocuments({publisher:{$ne:"人民邮电出版社"}}));
print("Q6  计算机或经济管理类：       ", db.books.countDocuments({category:{$in:["计算机","经济管理"]}}));

print("\n========== 组合检索 Q7~Q12 ==========");
print("Q7  评分>4.0 且计算机类：       ", db.books.countDocuments({$and:[{rating:{$gt:4.0}},{category:"计算机"}]}));
print("Q8  评分<3.5 或库存=0：        ", db.books.countDocuments({$or:[{rating:{$lt:3.5}},{stock:0}]}));
print("Q9  书名含 Python：            ", db.books.countDocuments({title:{$regex:"Python"}}));
print("Q10 同时带[编程,入门]标签：    ", db.books.countDocuments({tags:{$all:["编程","入门"]}}));
print("Q11 tags 恰好 3 个：           ", db.books.countDocuments({tags:{$size:3}}));
print("Q12 含 tags 字段：              ", db.books.countDocuments({tags:{$exists:true}}));

print("\n========== 结果处理 Q13~Q16 ==========");
print("Q13 _id 为字符串类型：         ", db.books.countDocuments({_id:{$type:"string"}}));
print("Q14 评分前 5：");
db.books.find({},{title:1,rating:1,_id:0}).sort({rating:-1}).limit(5).forEach(d=>print("   ", d.title, d.rating));
print("Q15 投影（书名/价格/评分，不含_id）示例：");
db.books.find({},{title:1,price:1,rating:1,_id:0}).limit(3).forEach(d=>print("   ", JSON.stringify(d)));
print("Q16 所有类别：                 ", db.books.distinct("category"));

print("\n========== 更新 U1~U4 ==========");
print("U1  某书库存 -5：");
print("   ", db.books.updateOne({isbn:"9787115428028"}, {$inc:{stock:-5}}).modifiedCount, "条被修改");
print("U2  计算机类 9 折：");
print("   ", db.books.updateMany({category:"计算机"}, {$mul:{price:0.9}}).modifiedCount, "条被修改");
print("U3  新增字段 last_modified 当前时间：");
print("   ", db.books.updateOne({isbn:"9787115428028"}, {$currentDate:{last_modified:true}}).modifiedCount, "条被修改");
print("U4  删除某书 tags 字段：");
print("   ", db.books.updateOne({isbn:"9787115428028"}, {$unset:{tags:""}}).modifiedCount, "条被修改");

print("\n========== 删除 D1~D3 ==========");
print("D1  删除一条已归还记录：");
const oneReturned = db.borrow_logs.findOne({status:"已归还"});
if (oneReturned) print("   ", db.borrow_logs.deleteOne({_id:oneReturned._id}).deletedCount, "条被删除");
print("D2  清理逾期记录（先预览数量）：", db.borrow_logs.countDocuments({status:"逾期"}), "条");
print("   实际删除：", db.borrow_logs.deleteMany({status:"逾期"}).deletedCount, "条");
print("D3  整体替换一位读者（保留 _id）：");
const r = db.readers.findOne({card_no:"R20240001"});
if (r) {
  const newDoc = Object.assign({}, r, {phone:"13900000001", level:"教师"});
  delete newDoc._id;
  print("   ", db.readers.replaceOne({card_no:"R20240001"}, newDoc).modifiedCount, "条被替换");
}
