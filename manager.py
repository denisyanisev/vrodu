from flask import Flask, render_template, request, jsonify
from flask_bootstrap import Bootstrap
from loguru import logger
from db import DBClient
import random

app = Flask(__name__)
Bootstrap(app)

relative_type_str = "relative_type"
from_id_str = 'from_id'


def make_persons():
    db = DBClient()['family']
    collection = db['persons']
    persons = list()
    for person in collection.find():
        person['id'] = person.pop('_id')
        person['title'] = ' '.join([person['first_name'], person['middle_name'], person['last_name']])
        person['parents'] = person['parents'].split(',') if person['parents'] else ''
        person['itemTitleColor'] = "#88aae9" if person['sex'] == 'M' else "#ffb1c7"
        if not person['alive'] and person['death']:
            years = (person['birth'] if person['birth'] else '...') + ' - ' + person['death']
        elif not person['alive']:
            years = (person['birth'] if person['birth'] else '...') + ' - ...'
        else:
            years = person['birth']
        person['years'] = years
        person['alive'] = str(person['alive'])
        persons.append(person)
    return persons


@app.route('/')
def index():
    persons = make_persons()
    return render_template('index.html', persons=persons)


@app.route('/add')
def add_person():
    query_args = request.args
    db = DBClient()['family']
    collection = db['persons']
    new_id = collection.find_one({}, sort=[('_id', -1)])['_id'] + 1 if collection.count() else 0
    first_name = query_args.get('first_name')
    middle_name = query_args.get('middle_name')
    last_name = query_args.get('last_name')
    description = query_args.get('description')
    birth = query_args.get('birth')
    is_alive = query_args.get('is_alive') == 'true'
    death = query_args.get('death')
    sex = query_args.get('sex')
    from_id = query_args.get(from_id_str, '')
    image = 'abc'[int(random.random()*3)] if sex == 'M' else 'fpt'[int(random.random()*3)]
    location = query_args.get('location')
    relative_type = query_args.get(relative_type_str) #кого мы добавляем
    vk_id = query_args.get('vk_id')
    if relative_type == 'child':
        parent = str(from_id)
    elif relative_type == 'parent':
        parents = collection.find_one({'_id': int(from_id)})['parents']
        if ',' in parents:
            return jsonify({'Error': 'Больше двух родителей', 'persons': -1})
        parent = ''
    elif relative_type == 'new_person':
        parent = ''

    collection.insert_one({'_id': new_id,
                           'first_name': first_name,
                           'middle_name': middle_name,
                           'last_name': last_name,
                           'parents': parent,
                           'image': f'/static/photos/{image}.png',
                           'description': description,
                           'sex': sex,
                           'birth': birth,
                           'death': death,
                           'alive': is_alive,
                           'location': location,
                           'vk_id': vk_id
                           })
    return jsonify({'new_id': new_id, 'persons': make_persons()})


@app.route('/change')
def change_person():
    query_args = request.args
    collection = DBClient()['family']['persons']
    person_id = query_args.get('id')
    parents = collection.find_one({'_id': int(person_id)})['parents']
    new_id = query_args.get('new_id')
    if ',' in parents:
        return jsonify({'Error': 'more than 2 parents', 'persons': -1})
    elif not parents:
        new_parents = str(new_id)
    else:
        new_parents = parents + ',' + new_id

    collection.update_one({'_id': int(person_id)}, {'$set': {'parents': new_parents}})
    return jsonify({'Status': 'ok', 'persons': make_persons()})


@app.route('/link')
def link():
    query_args = request.args
    collection = DBClient()['family']['persons']
    person_id = query_args.get('person_id')
    link_id = query_args.get('link_id')
    relative_type = query_args.get(relative_type_str)
    if relative_type == 'child':
        parents = collection.find_one({'_id': int(link_id)})['parents']
        if ',' in parents:
            return jsonify({'Error': 'Больше двух родителей', 'persons': -1})
        elif person_id in parents:
            return jsonify({'Error': 'Нельзя связать ребенка дважды', 'persons': -1})
        elif not parents:
            new_parents = str(person_id)
        else:
            new_parents = parents + ',' + person_id
        collection.update_one({'_id': int(link_id)}, {'$set': {'parents': new_parents}})

    elif relative_type == 'parent':
        parents = collection.find_one({'_id': int(person_id)})['parents']
        if ',' in parents:
            return jsonify({'Error': 'Больше двух родителей', 'persons': -1})
        elif link_id in parents:
            return jsonify({'Error': 'Нельзя связать родителя дважды', 'persons': -1})
        elif not parents:
            new_parents = str(link_id)
        else:
            new_parents = parents + ',' + link_id
        collection.update_one({'_id': int(person_id)}, {'$set': {'parents': new_parents}})
    else:
        return jsonify({'Failed': 'Нельзя связать', 'persons': -1})

    return jsonify({'Status': 'ok', 'persons': make_persons()})


@app.route('/remove')
def remove():
    query_args = request.args
    db = DBClient()['family']
    collection = db['persons']
    person_id = query_args.get('person_id')
    try:
        collection.delete_one({'_id': int(person_id)})
        person_id_regex = r'(^|,)' + person_id + r'(,|$)'
        found_persons = collection.find({'parents': {'$regex': person_id_regex }})
        for person in found_persons:
            person['parents'] = person['parents'].replace(person_id, '').replace(',', '')
            collection.update_one({'_id': person['_id']}, {'$set': {'parents': person['parents']}})
        return jsonify({'Status': 'Person removed', 'persons': make_persons()})
    except (ValueError, TypeError):
        return jsonify({'Error': 'Remove failed', 'persons': -1})


@app.route('/pull')
def pull_info():
    query_args = request.args
    db = DBClient()['family']
    collection = db['persons']
    target_id = query_args.get('target_id')
    try:
        return jsonify({'result': list(collection.find({'_id': int(target_id)}))})
    except (ValueError, TypeError):
        return jsonify({'Error': 'Remove failed', 'persons': -1})


if __name__ == '__main__':
    app.run(debug=True)
    #app.run(debug=True, host="0.0.0.0")
