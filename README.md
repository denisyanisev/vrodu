Preparation for Linux: 
> python3 -m pip install -r requirements 

Mongodb preparation:
> sudo apt-get install mongodb \
> mongo \
> use family \
> db.createUser({user:'vrodu', pwd:'vrodu123', roles:['readWrite', 'dbOwner']})

Check db connection: 
> mongo mongodb://vrodu:vrodu123@localhost:27017/family

Start application: 
> python3 manager.py

Check application:
> curl localhost:5000

Deploying on server:
> cd /var/www/scriptina.ru/vrodu
> sudo -u www-data git pull
> sudo service apache2 restart
> 
OR:
> sudo ~/.vrodu/deploy

Wiping a collection:
> mongo
> use family
> db.auth('vrodu', 'vrodu123)
> db.persons.remove({})