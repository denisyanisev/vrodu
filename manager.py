from flask import Flask, render_template, request, jsonify
from flask_bootstrap import Bootstrap
from db import DBClient
import random
import logging


app = Flask(__name__)
logging.basicConfig(filename=app.root_path + '/application.log', level=logging.INFO)
Bootstrap(app)

relative_type_str = "relative_type"
from_id_str = 'from_id'
parent_m_str = 'parent_m'
parent_f_str = 'parent_f'


def make_direct_relatives(person_id):
    db = DBClient()['family']
    collection = db['persons']
    person = collection.find_one({'_id': person_id})
    relatives = list(filter(lambda x: not (x is None or x == ''), (person['parent_m'], person['parent_f'])))
    for a in list(relatives):
        relatives.extend(make_direct_relatives(a))
    return relatives


def make_persons(tree_id: int = 0):
    db = DBClient()['family']
    collection = db['persons']
    persons = list()
    persons_list = collection.find({'tree_id': tree_id})
    for person in persons_list:
        person['id'] = person.pop('_id')
        if person.get('maiden_name'):
            last_name = f'{person.get("last_name")} ({person.get("maiden_name")})'
        else:
            last_name = person.get('last_name')
        person['title'] = ' '.join([person.get('first_name'), person.get('middle_name'), last_name]).strip()
        person['title'] = person['title'].replace('  ', ' ')
        person['parents'] = [person.pop(parent_m_str), person.pop(parent_f_str)]
        if not person['alive'] and person['death']:
            years = (person['birth'] if person['birth'] else '...') + '-' + person['death']
        elif not person['alive']:
            years = (person['birth'] if person['birth'] else '...') + '-...'
        else:
            years = person['birth']
        person['years'] = years
        person['alive'] = person['alive']
        persons.append(person)
    return persons


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/update', methods=['POST'])
def fetch_persons():
    query_args = request.get_json(True)
    collection = DBClient()['family']['persons']
    user_id = query_args.get('user_id')
    tree_list = [tree['tree_id'] for tree in collection.find({'vk_id': user_id})]
    tree_id = query_args.get('tree_id', user_id if tree_list else 0)
    return jsonify({'persons': make_persons(tree_id), 'tree_list': tree_list})


@app.route('/add', methods=['POST'])
def add_person():
    query_args = request.get_json(True)
    collection = DBClient()['family']['persons']
    new_id = collection.find_one({}, sort=[('_id', -1)])['_id'] + 1 if collection.count_documents(dict()) else 0
    first_name = query_args.get('first_name').strip()
    middle_name = query_args.get('middle_name').strip()
    last_name = query_args.get('last_name').strip()
    description = query_args.get('description').strip()
    birth = query_args.get('birth')
    is_alive = query_args.get('is_alive')
    death = query_args.get('death')
    sex = query_args.get('sex')
    from_id = query_args.get(from_id_str)
    image = 'abc'[int(random.random()*3)] if sex == 'M' else 'fpt'[int(random.random()*3)]
    location = query_args.get('location')
    coordinate0 = query_args.get('coordinate0', '')
    coordinate1 = query_args.get('coordinate1', '')
    relative_type = query_args.get(relative_type_str)  # кого мы добавляем
    vk_id = query_args.get('vk_id')
    tree_id = query_args.get('tree_id')
    photo = query_args.get('photo')
    maiden_name = query_args.get('maiden_name', '')
    full_desc = query_args.get('full_desc', '')
    nationality = query_args.get('nationality', '').strip().lower()
    vk_confirm = query_args.get('vk_confirm')
    parent_m = ''
    parent_f = ''
    if relative_type == 'child':
        person = collection.find_one({'_id': from_id})
        if person['sex'] == 'M':
            parent_m = from_id
        else:
            parent_f = from_id
    elif relative_type == 'parent':
        person = collection.find_one({'_id': from_id})
        person_name = ' '.join((person['first_name'], person['middle_name'], person['last_name'])).strip()
        if person[parent_m_str] and sex == 'M':
            return jsonify({'Error': f'У {person_name} уже есть отец.', 'persons': -1})
        elif person[parent_f_str] and sex == 'F':
            return jsonify({'Error': f'У {person_name} уже есть мать.', 'persons': -1})

    collection.insert_one({'_id': new_id,
                           'first_name': first_name,
                           'middle_name': middle_name,
                           'last_name': last_name,
                           'parent_m': parent_m,
                           'parent_f': parent_f,
                           'spouses': [],
                           'image': photo or f'/static/photos/{image}.png',
                           'description': description,
                           'sex': sex,
                           'birth': birth,
                           'death': death,
                           'alive': is_alive,
                           'location': location,
                           'coordinate0': coordinate0,
                           'coordinate1': coordinate1,
                           'vk_id': vk_id,
                           'maiden_name': maiden_name,
                           'full_desc': full_desc,
                           'nationality': nationality,
                           'tree_id': tree_id,
                           'permissions': 777,
                           'vk_confirm': vk_confirm
                           })
    return jsonify({'new_id': new_id, 'persons': make_persons(tree_id)})


@app.route('/change', methods=['POST'])
def change_person():
    request_data = request.get_json(True)
    edit_person = request_data.get('edit_person')
    request_data.pop('edit_person', False)
    person_id = request_data.pop('from_id')
    request_data.pop('from_id', False)
    tree_id = request_data.get('tree_id')
    collection = DBClient()['family']['persons']
    new_id = request_data.get('new_id')
    sex = request_data.get('sex')
    parent_str = parent_m_str if sex == 'M' else parent_f_str
    try:
        if edit_person:
            collection.update_one({'_id': int(person_id)}, {'$set': request_data})
        else:
            collection.update_one({'_id': int(person_id)}, {'$set': {parent_str: new_id}})
        return jsonify({'Status': 'ok', 'persons': make_persons(tree_id)})
    except (ValueError, TypeError):
        return jsonify({'Error': 'Нe удалось изменить персону.', 'persons': -1})


@app.route('/link', methods=['POST'])
def link():
    query_args = request.get_json(True)
    collection = DBClient()['family']['persons']
    user_id = query_args.get('user_id')
    link_type = query_args.get('link_type')
    from_id = query_args.get('person_id')
    target_id = query_args.get('link_id')
    target_person = collection.find_one({'_id': int(query_args.get('link_id'))})
    from_person = collection.find_one({'_id': int(query_args.get('person_id'))})
    target_name = ' '.join((target_person['first_name'], target_person['middle_name'], target_person['last_name']))
    from_name = ' '.join((from_person['first_name'], from_person['middle_name'], from_person['last_name']))
    if link_type == 'spouse':
        if target_person['sex'] == from_person['sex']:
            return jsonify({'Error': 'Запрещено создавать однополные браки.', 'persons': -1})
        if from_id in target_person['spouses']:
            return jsonify({'Error': 'Между персонами уже есть брак.', 'persons': -1})
        collection.update_one({'_id': int(target_id)}, {'$push': {'spouses': from_id}})
        collection.update_one({'_id': int(from_id)}, {'$push': {'spouses': target_id}})
        return jsonify({'Status': 'ok', 'persons': make_persons(user_id)})
    else:
        if link_type == 'parent':
            from_name, target_name = target_name, from_name
            from_id, target_id = target_id, from_id
            from_person, target_person = target_person, from_person
        try:
            if target_id in make_direct_relatives(from_id):
                return jsonify({'Error': f'{target_name} является предком {from_name}.', 'persons': -1})
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
            return jsonify({'Error': 'Не удалось связать персоны.', 'persons': -1})
        return jsonify({'Status': 'ok', 'persons': make_persons(user_id)})


@app.route('/remove', methods=['POST'])
def remove():
    query_args = request.get_json(True)
    collection = DBClient()['family']['persons']
    user_id = query_args.get('user_id')
    person_id = query_args.get('person_id')
    person = collection.find_one({'_id': int(person_id), 'tree_id': user_id})
    if not person:
        return jsonify({'Error': 'Не найдена персона для удаления', 'persons': -1})
    sex = person['sex']
    parent_str = parent_m_str if sex == 'M' else parent_f_str
    try:
        collection.delete_one({'_id': int(person_id)})
        collection.update_many({parent_str: person_id}, {'$set': {parent_str: ''}})
        collection.update_many({'spouses': person_id}, {'$pull': {'spouses': person_id}})
        return jsonify({'Status': 'Персона удалена.', 'persons': make_persons(user_id)})
    except (ValueError, TypeError):
        return jsonify({'Error': 'Удаление персоны неуспешно.', 'persons': -1})


@app.route('/map', methods=['POST'])
def get_map():
    user_id = request.get_json(True).get('user_id')
    if not user_id:
        user_id = 0
    collection = DBClient()['family']['persons']
    locations = []
    for person in collection.find({'tree_id': user_id, 'coordinate0': {'$exists': True, '$ne': ''}}):
        person_name = ' '.join((person['first_name'], person['middle_name'], person['last_name'])).strip()
        locations.append({'person': person_name, 'coordinates': [person['coordinate0'], person['coordinate1']]})
    return render_template('map.html', locations=locations)


@app.route('/uploadphoto', methods=['POST'])
def upload_photo():
    content = request.form
    collection = DBClient()['family']['persons']
    try:
        file = request.files['photo']
        user_id = int(content['user_id'])
        person_id = int(content['from_id'])
        ext = content["ext"]
        hashed = hash(file)
        path = f'/static/photos/custom/{person_id}_{hashed}.{ext}'
        file.save(app.root_path + path)
        collection.update_one({'_id': int(person_id)}, {'$set': {'image': path}})
        return jsonify({'persons': make_persons(user_id)})
    except TypeError as err:
        return jsonify({'Error': 'Загрузка фото неуспешна.', 'persons': -1})


if __name__ == '__main__':
    app.run(debug=True)
