from pymongo import MongoClient


class DBClient:
    __db = None

    def __new__(cls, *args, **kwargs):
        if cls.__db is None:
            DBClient.__db = MongoClient(
                f'mongodb://localhost:27017/rentads')

        return cls.__db
