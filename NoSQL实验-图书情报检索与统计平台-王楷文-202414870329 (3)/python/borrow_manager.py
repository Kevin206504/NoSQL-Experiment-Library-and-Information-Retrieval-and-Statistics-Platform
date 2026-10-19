# -*- coding: utf-8 -*-
"""
borrow_manager.py
借阅登记、归还处理、逾期查询。
"""
from datetime import datetime
from mongodb_connect import get_db

db = get_db()
logs = db["borrow_logs"]


def borrow_book(reader_card: str, book_isbn: str):
    """登记一条新借阅。"""
    doc = {
        "borrow_date": datetime.now(),
        "reader_card": reader_card,
        "book_isbn": book_isbn,
        "status": "借出"
    }
    return logs.insert_one(doc).inserted_id


def return_book(log_id):
    """归还：更新状态并写归还时间。"""
    return logs.update_one(
        {"_id": log_id},
        {"$set": {"status": "已归还", "return_date": datetime.now()}}
    )


def mark_overdue(reader_card: str):
    """把某读者逾期记录批量标记为逾期。"""
    return logs.update_many(
        {"reader_card": reader_card, "status": "借出"},
        {"$set": {"status": "逾期"}}
    )


def list_active():
    """当前未归还的借阅。"""
    return list(logs.find({"status": {"$in": ["借出", "逾期"]}}))


def list_overdue():
    return list(logs.find({"status": "逾期"}))


def delete_returned():
    """删除所有已归还记录。"""
    return logs.delete_many({"status": "已归还"})


def delete_overdue():
    """清理逾期记录（先返回数量供确认）。"""
    n = logs.count_documents({"status": "逾期"})
    return logs.delete_many({"status": "逾期"}), n


def count_all():
    return logs.count_documents({})
