# -*- coding: utf-8 -*-
"""
mongodb_connect.py
数据库连接模块：所有其他模块统一从这里获取 library 数据库连接。
"""
from pymongo import MongoClient

# 连接参数（按需修改虚拟机 IP / 端口 / 账号密码）
MONGO_URI = "mongodb://libWriter:write@123.0.0.1:27017/library?authSource=admin"
DB_NAME = "library"

_client = None


def get_client():
    """获取全局 MongoClient（单例）。"""
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI)
    return _client


def get_db():
    """获取 library 数据库对象。"""
    return get_client()[DB_NAME]


def ping():
    """测试连接，返回 (是否成功, 版本信息)。"""
    try:
        info = get_client().admin.command("buildInfo")
        return True, info.get("version", "unknown")
    except Exception as e:
        return False, str(e)


def close():
    """关闭连接。"""
    global _client
    if _client is not None:
        _client.close()
        _client = None
