# -*- coding: utf-8 -*-
"""
reader_manager.py
读者信息管理：读者查询、学院统计、等级分布。
"""
from mongodb_connect import get_db

db = get_db()
readers = db["readers"]


def get_reader(card_no: str):
    return readers.find_one({"card_no": card_no})


def list_readers(limit=20):
    return list(readers.find().limit(limit))


def readers_without_email():
    """email 为空的读者。"""
    return list(readers.find({"email": None}))


def count_by_college():
    """按学院分组统计人数。"""
    return list(readers.aggregate([
        {"$group": {"_id": "$college", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]))


def count_by_level():
    """按借阅等级统计。"""
    return list(readers.aggregate([
        {"$group": {"_id": "$level", "count": {"$sum": 1}}}
    ]))


def distinct_colleges():
    return readers.distinct("college")


def replace_reader(card_no: str, new_doc: dict):
    """整体替换读者信息（保留 _id）。"""
    new_doc.pop("_id", None)
    return readers.replace_one({"card_no": card_no}, new_doc)


def count_all():
    return readers.count_documents({})
