# -*- coding: utf-8 -*-
"""
stat_manager.py
聚合统计：分类统计、借阅趋势、畅销榜、学院借阅排行。
"""
from mongodb_connect import get_db

db = get_db()


def category_stats():
    """按类别统计图书数量、平均评分、库存总量。"""
    return list(db.books.aggregate([
        {"$group": {
            "_id": "$category",
            "count": {"$sum": 1},
            "avgRating": {"$avg": "$rating"},
            "totalStock": {"$sum": "$stock"}
        }},
        {"$sort": {"totalStock": -1}}
    ]))


def borrow_trend_by_year():
    """按年份统计借阅量，格式如 2024 年。"""
    return list(db.borrow_logs.aggregate([
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y年", "date": "$borrow_date"}},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}}
    ]))


def hot_books(top_n=5):
    """借阅次数最多的图书。"""
    return list(db.books.aggregate([
        {"$sort": {"borrow_count": -1}},
        {"$limit": top_n},
        {"$project": {"_id": 0, "title": 1, "borrow_count": 1, "rating": 1}}
    ]))


def college_borrow_rank():
    """学院借阅量排行（lookup 读者与借阅流水）。"""
    return list(db.readers.aggregate([
        {"$lookup": {
            "from": "borrow_logs",
            "localField": "card_no",
            "foreignField": "reader_card",
            "as": "logs"
        }},
        {"$group": {
            "_id": "$college",
            "borrowCount": {"$sum": {"$size": "$logs"}}
        }},
        {"$sort": {"borrowCount": -1}}
    ]))


def sales_top(top_n=5):
    """销售额 = 单价 × 借阅次数。"""
    return list(db.books.aggregate([
        {"$project": {
            "_id": 0, "title": 1,
            "sales": {"$round": [{"$multiply": ["$price", "$borrow_count"]}, 2]}
        }},
        {"$sort": {"sales": -1}},
        {"$limit": top_n}
    ]))
