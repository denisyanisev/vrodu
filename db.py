from pymongo import MongoClient

MONGO_USER = 'vrodu'
MONGO_PASSWORD = 'vrodu123'


class DBClient:
    __db = None

    def __new__(cls, *args, **kwargs):
        if cls.__db is None:
            DBClient.__db = MongoClient(
                f'mongodb://{MONGO_USER}:{MONGO_PASSWORD}@localhost:27017/family')

        return cls.__db
