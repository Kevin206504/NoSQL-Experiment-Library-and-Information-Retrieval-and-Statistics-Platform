// ============================================================
// setup.js  ——  NoSQL01 虚拟机上一键完成任务一~任务四
// 用法：mongosh 后执行  load("/home/user/student/setup.js")
// 数据文件 books.txt / readers.txt / borrow_logs.txt 放在同目录下
// ============================================================

// ---- 0. 切换数据库 ----
db = db.getSiblingDB("library");

// ---- 1. 任务二：创建集合（先删后建，避免重复运行报错）----
print("===== 1. 创建集合 =====");

// 1.1 普通集合（如果不存在会自动建）
db.createCollection("books");
db.createCollection("readers");
db.createCollection("category_stats");

// 1.2 固定集合 book_logs：1MB 上限、最多 1000 条
db.runCommand({
  create: "book_logs",
  capped: true,
  size: 1048576,        // 1 MB
  max: 1000
});
print("  ✓ 固定集合 book_logs（capped, 1MB, max 1000）");

// 1.3 时间序列集合 borrow_logs：时间字段 borrow_date，粒度 hours，2 年过期
db.runCommand({
  create: "borrow_logs",
  timeseries: {
    timeField: "borrow_date",
    granularity: "hours",
    bucketMaxSpanSeconds: 3600
  },
  expireAfterSeconds: 63072000   // 2 年
});
print("  ✓ 时间序列集合 borrow_logs（timeField=borrow_date, hours, TTL=2年）");

// 1.4 视图 book_in_stock：books 中 stock > 0
db.createView("book_in_stock", "books", [
  {$match: {stock: {$gt: 0}}}
]);
print("  ✓ 视图 book_in_stock（基于 books, stock>0）");

// ---- 2. 导入数据 ----
print("\n===== 2. 导入数据 =====");
const fs = require("fs");
const DATA_DIR = "/home/user/student";   // ← 改成你虚拟机上数据文件所在目录

// 2.1 insertOne 单独录一条（任务书要求）
db.books.insertOne({
  isbn: "9787115428028",
  title: "Python编程：从入门到实践",
  author: "埃里克·马瑟斯",
  publisher: "人民邮电出版社",
  category: "计算机",
  price: 89.0, stock: 15, rating: 4.6,
  tags: ["编程", "入门", "Python"],
  publish_date: new Date("2023-03-01"),
  borrow_count: 127
});
print("  ✓ insertOne 示例图书已写入");

// 2.2 insertMany 批量导入（去掉第一条避免重复）
const booksAll = EJSON.parse(fs.readFileSync(DATA_DIR + "/books.txt", "utf8"));
db.books.insertMany(booksAll.slice(1));

const readersAll = EJSON.parse(fs.readFileSync(DATA_DIR + "/readers.txt", "utf8"));
db.readers.insertMany(readersAll);

const logsAll = EJSON.parse(fs.readFileSync(DATA_DIR + "/borrow_logs.txt", "utf8"));
db.borrow_logs.insertMany(logsAll);

print(`  ✓ books=${db.books.countDocuments()}  readers=${db.readers.countDocuments()}  borrow_logs=${db.borrow_logs.countDocuments()}`);

// ---- 3. 任务四：建立索引 ----
print("\n===== 3. 建立索引 =====");
db.books.createIndex({isbn: 1}, {unique: true, name: "uniq_isbn"});
db.books.createIndex({title: 1}, {name: "idx_title"});
db.books.createIndex({category: 1}, {name: "idx_category"});
db.books.createIndex({tags: 1}, {name: "idx_tags_multikey"});
db.books.createIndex({category: 1, price: -1}, {name: "idx_category_price"});
print("  ✓ 5 个索引已建：", db.books.getIndexes().map(x => x.name).join(", "));

// ---- 4. 任务四：创建用户 ----
print("\n===== 4. 创建用户 =====");
db.getSiblingDB("admin").createUser({
  user: "libReader", pwd: "lib@123456",
  roles: [{role: "read", db: "library"}]
});
db.getSiblingDB("admin").createUser({
  user: "libWriter", pwd: "write@123456",
  roles: [{role: "readWrite", db: "library"}, {role: "dbAdmin", db: "library"}]
});
print("  ✓ libReader（read）和 libWriter（readWrite+dbAdmin）已建");

// ---- 5. 集合清单核对 ----
print("\n===== 5. 当前集合清单 =====");
db.getCollectionInfos().forEach(c => {
  const type = c.type === "timeseries" ? "时间序列"
             : c.options.capped ? "固定集合"
             : c.type === "view" ? "视图" : "普通集合";
  print(`  - ${c.name}  [${type}]`);
});

print("\n🎉 setup.js 执行完毕。下一步：");
print("   1) 关闭 mongod，加 --auth 重启：");
print("      mongod --dbpath /data/db --auth --fork --logpath /var/log/mongod.log");
print("   2) 用 libWriter 账号登录后执行 queries.js（任务三）和 aggregations.js（任务四）");
