PREPARE STEPS for Ubuntu: 
> pip3 install -r requirements 

MONGO preparation:
> sudo apt-get install mongodb
> mongo
> use family
> db.createUser({user:'vrodu', pwd:'vrodu123', roles:[{role:'readWrite', db:'family'}, {role:'dbOwner', db:'family'}]})
check db connection: 
> mongo mongodb://vrodu:vrodu123@localhost:27017/family

start application: 
> python manager.py
check application
> curl localhost:5000
