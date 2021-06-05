from flask import Flask, render_template, request, jsonify
from flask_bootstrap import Bootstrap
# from loguru import logger
from db import DBClient
import random

app = Flask(__name__)
Bootstrap(app)

relative_type_str = "relative_type"
from_id_str = 'from_id'
parent_m_str = 'parent_m'
parent_f_str = 'parent_f'


def make_persons(tree_owner: str = '0'):
    db = DBClient()['family']
    collection = db['persons']
    persons = list()
    for person in collection.find({'tree_owner': tree_owner}):
        person['id'] = person.pop('_id')
        person['title'] = ' '.join([person['first_name'], person['middle_name'], person['last_name']])
        person['parents'] = [person[parent_m_str], person[parent_f_str]]
        if person['parents'] == ',':
            person['parents'] = ''
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
    return render_template('index.html')

@app.route('/update')
def fetch_persons():
    return jsonify({'persons': make_persons(request.args.get('user_id'))})

@app.route('/add')
def add_person():
    query_args = request.args
    collection = DBClient()['family']['persons']
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
    relative_type = query_args.get(relative_type_str)  # кого мы добавляем
    vk_id = query_args.get('vk_id')
    user_id = query_args.get('user_id')
    photo = query_args.get('photo')
    parent_m = ''
    parent_f = ''
    if relative_type == 'child':
        person = collection.find_one({'_id': int(from_id)})
        if person['sex'] == 'M':
            parent_m = from_id
        else:
            parent_f = from_id
    elif relative_type == 'parent':
        person = collection.find_one({'_id': int(from_id)})
        person_name = ' '.join((person['first_name'], person['middle_name'], person['last_name']))
        if person[parent_m_str] and sex == 'M':
            return jsonify({'Error': f'У {person_name} уже есть отец.', 'persons': -1})
        elif person[parent_f_str] and sex == 'F':
            return jsonify({'Error': f'У {person_name} уже есть мать.', 'persons': -1})

    collection.insert_one({'_id': new_id,
                           'first_name': first_name,
                           'middle_name': middle_name,
                           'last_name': last_name,
                           parent_m_str: parent_m,
                           parent_f_str: parent_f,
                           'image': photo or f'/static/photos/{image}.png',
                           'description': description,
                           'sex': sex,
                           'birth': birth,
                           'death': death,
                           'alive': is_alive,
                           'location': location,
                           'vk_id': vk_id,
                           'tree_owner': user_id,
                           })
    return jsonify({'new_id': new_id, 'persons': make_persons(user_id)})


@app.route('/change')
def change_person():
    query_args = request.args
    collection = DBClient()['family']['persons']
    person_id = query_args.get('id')
    new_id = query_args.get('new_id')
    sex = query_args.get('sex')
    user_id = query_args.get('user_id')
    parent_str = parent_m_str if sex == 'M' else parent_f_str
    collection.update_one({'_id': int(person_id)}, {'$set': {parent_str: new_id}})
    return jsonify({'Status': 'ok', 'persons': make_persons(user_id)})


@app.route('/link')
def link():
    query_args = request.args
    collection = DBClient()['family']['persons']
    user_id = query_args.get('user_id')
    from_id = query_args.get('person_id')
    target_id = query_args.get('link_id')
    relative_type = query_args.get(relative_type_str)
    target_person = collection.find_one({'_id': int(query_args.get('link_id'))})
    from_person = collection.find_one({'_id': int(query_args.get('person_id'))})
    target_name = ' '.join((target_person['first_name'], target_person['middle_name'], target_person['last_name']))
    from_name = ' '.join((from_person['first_name'], from_person['middle_name'], from_person['last_name']))
    if relative_type == 'parent':
        from_name, target_name = target_name, from_name
        from_id, target_id = target_id, from_id
        from_person, target_person = target_person, from_person
    try:
        if from_person['sex'] == 'M':
            if from_id == target_person[parent_m_str]:
                return jsonify({'Error': f'{from_name} уже является отцом {target_name}.', 'persons': -1})
            elif target_person[parent_m_str]:
                return jsonify({'Error': f'У {target_name} уже есть отец.', 'persons': -1})
            collection.update_one({'_id': int(target_id)}, {'$set': {parent_m_str: from_id}})
        else:
            if from_id == target_person[parent_f_str]:
                return jsonify({'Error': f'{from_name} уже является матерью {target_name}.', 'persons': -1})
            elif target_person[parent_f_str]:
                return jsonify({'Error': f'У {target_name} уже есть мать.', 'persons': -1})
            collection.update_one({'_id': int(target_id)}, {'$set': {parent_f_str: from_id}})
    except (ValueError, TypeError):
        return jsonify({'Failed': 'Не удалось связать персоны.', 'persons': -1})

    return jsonify({'Status': 'ok', 'persons': make_persons(user_id)})


@app.route('/remove')
def remove():
    query_args = request.args
    collection = DBClient()['family']['persons']
    user_id = query_args.get('user_id')
    person_id = query_args.get('person_id')
    sex = collection.find_one({'_id': int(person_id)})['sex']
    parent_str = parent_m_str if sex == 'M' else parent_f_str
    try:
        collection.delete_one({'_id': int(person_id)})
        collection.update_many({parent_str: person_id}, {'$set': {parent_str: ''}})
        return jsonify({'Status': 'Персона удалена.', 'persons': make_persons(user_id)})
    except (ValueError, TypeError):
        return jsonify({'Error': 'Удаление персоны неуспешно.', 'persons': -1})


@app.route('/pull')
def pull_info():
    query_args = request.args
    collection = DBClient()['family']['persons']
    person_id = query_args.get('person_id')
    try:
        return jsonify({'result': list(collection.find({'_id': int(person_id)}))})
    except (ValueError, TypeError):
        return jsonify({'Error': 'Ошибка запроса.', 'persons': -1})


if __name__ == '__main__':
    app.run(debug=True)
    # app.run(debug=True, host="0.0.0.0")
