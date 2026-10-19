# -*- coding: utf-8 -*-
"""
book_manager.py
图书信息管理：增删改查、条件检索、评分排行。
"""
from bson import ObjectId
from mongodb_connect import get_db

db = get_db()
books = db["books"]


def add_book(doc: dict):
    """新增一本图书。"""
    result = books.insert_one(doc)
    return result.inserted_id


def add_books(docs: list):
    """批量新增。"""
    return books.insert_many(docs).inserted_ids


def get_book_by_isbn(isbn: str):
    """按 ISBN 精确查找。"""
    return books.find_one({"isbn": isbn})


def search_books(query: dict, sort_field="rating", limit=10):
    """通用条件检索。"""
    return list(books.find(query).sort(sort_field, -1).limit(limit))


def price_above(threshold: float):
    """价格大于 threshold 的图书。"""
    return list(books.find({"price": {"$gt": threshold}}))


def stock_less_than(n: int):
    """库存少于 n 的图书。"""
    return list(books.find({"stock": {"$lt": n}}))


def rating_top(n: int = 5):
    """评分前 n 名。"""
    return list(books.find({}, {"title": 1, "rating": 1, "_id": 0})
                .sort("rating", -1).limit(n))


def decrease_stock(isbn: str, n: int = 5):
    """库存减少 n。"""
    return books.update_one({"isbn": isbn}, {"$inc": {"stock": -n}})


def discount_category(category: str, ratio: float = 0.9):
    """某类别图书打 ratio 折。"""
    return books.update_many({"category": category},
                             {"$mul": {"price": ratio}})


def remove_tags(isbn: str):
    """删除某本书的 tags 字段。"""
    return books.update_one({"isbn": isbn}, {"$unset": {"tags": ""}})


def delete_book(isbn: str):
    """按 ISBN 删除图书。"""
    return books.delete_one({"isbn": isbn})


def count_all():
    return books.count_documents({})
