# -*- coding: utf-8 -*-
"""
main.py
菜单式主程序：串联 book / reader / borrow / stat 四个模块。
"""
from mongodb_connect import ping, get_db, close
import book_manager as bm
import reader_manager as rm
import borrow_manager as lm
import stat_manager as sm


def show_status():
    ok, info = ping()
    if not ok:
        print("❌ 数据库连接失败：", info)
        return False
    print(f"✅ 数据库连接成功（MongoDB {info}）")
    print(f"   books:       {bm.count_all()} 条")
    print(f"   readers:     {rm.count_all()} 条")
    print(f"   borrow_logs: {lm.count_all()} 条")
    return True


def menu():
    print("=" * 46)
    print("       图书情报检索与统计平台")
    print("=" * 46)
    print(" 1. 图书检索（价格 / 库存 / 评分）")
    print(" 2. 评分排行 Top5")
    print(" 3. 新增 / 修改 / 删除图书")
    print(" 4. 读者信息与学院统计")
    print(" 5. 借阅登记与归还")
    print(" 6. 分类统计报表")
    print(" 7. 借阅趋势（按年份）")
    print(" 8. 畅销图书 Top5")
    print(" 0. 退出")
    print("-" * 46)


def main():
    if not show_status():
        return
    while True:
        menu()
        choice = input("请选择功能编号：").strip()
        try:
            if choice == "1":
                n = float(input("价格大于多少元？") or 80)
                rs = bm.price_above(n)
                print(f"共 {len(rs)} 本：")
                for b in rs[:10]:
                    print(f"  {b['title']}  ¥{b['price']}  库存{b['stock']}")
            elif choice == "2":
                for b in bm.rating_top(5):
                    print(f"  {b.get('title')}  评分 {b.get('rating')}")
            elif choice == "3":
                op = input("a=新增 b=改库存 c=删除：").strip()
                if op == "a":
                    doc = {
                        "isbn": input("ISBN："),
                        "title": input("书名："),
                        "author": input("作者："),
                        "publisher": input("出版社："),
                        "category": input("类别："),
                        "price": float(input("价格：") or 0),
                        "stock": int(input("库存：") or 0),
                        "rating": float(input("评分：") or 0),
                        "tags": [], "borrow_count": 0
                    }
                    _id = bm.add_book(doc)
                    print(f"已插入，_id={_id}，受影响 1 条")
                elif op == "b":
                    isbn = input("ISBN：")
                    n = int(input("库存减少量（默认5）：") or 5)
                    r = bm.decrease_stock(isbn, n)
                    print(f"匹配 {r.matched_count}，修改 {r.modified_count} 条")
                elif op == "c":
                    isbn = input("要删除的 ISBN：")
                    r = bm.delete_book(isbn)
                    print(f"删除 {r.deleted_count} 条")
            elif choice == "4":
                print("学院分布：")
                for x in rm.count_by_college():
                    print(f"  {x['_id']}: {x['count']}")
            elif choice == "5":
                op = input("a=借阅 b=归还 c=逾期列表：").strip()
                if op == "a":
                    card = input("借阅证号：")
                    isbn = input("图书 ISBN：")
                    print("已登记，_id=", lm.borrow_book(card, isbn))
                elif op == "c":
                    for x in lm.list_overdue():
                        print(" ", x)
            elif choice == "6":
                for x in sm.category_stats():
                    print(f"  {x['_id']}: {x['count']}本, 均评{x['avgRating']:.2f}, 库存{x['totalStock']}")
            elif choice == "7":
                for x in sm.borrow_trend_by_year():
                    print(f"  {x['_id']}: {x['count']} 次")
            elif choice == "8":
                for x in sm.hot_books(5):
                    print(f"  {x['title']}  借阅{x['borrow_count']}  评分{x['rating']}")
            elif choice == "0":
                print("再见！")
                break
            else:
                print("无此功能项")
        except Exception as e:
            print("执行出错：", e)


if __name__ == "__main__":
    try:
        main()
    finally:
        close()
