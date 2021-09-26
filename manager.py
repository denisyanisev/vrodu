import random
import re

from flask import Flask, render_template, request, jsonify
from flask_bootstrap import Bootstrap
from flask_httpauth import HTTPBasicAuth
from werkzeug.security import generate_password_hash, check_password_hash
from logger import config
from logging.config import dictConfig
from basics import *


app = Flask(__name__)
Bootstrap(app)
app_root = app.root_path

logging.config.dictConfig(config(app.root_path))

auth = HTTPBasicAuth()
users = {
    "admin": generate_password_hash(os.environ.get('PASSWORD')),
}


@auth.verify_password
def verify_password(username, password):
    if username in users and \
            check_password_hash(users.get(username), password):
        return username


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/update', methods=['POST'])
def fetch_persons():
    query_args = request.get_json(True)
    collection = DBClient()['family']['persons']
    user_id = query_args.get('user_id')
    tree_list = {}
    user_collection = list(collection.find({'vk_id': user_id}))
    for tree_item in user_collection:
        tree_collection = list(collection.find({'tree_id': tree_item['tree_id']}))
        name = list(filter(lambda e: e['vk_id'] == e['tree_id'] == tree_item['tree_id'], tree_collection))[0]
        tree_list.update({tree_item['tree_id']: (len(list(tree_collection)), name['last_name'])})
    tree_id = query_args.get('tree_id', user_id if tree_list else 0)
    notifications_tree = list(set([x['tree_id']
                                   for x in list(filter(lambda e: e['vk_confirm'] == 0, user_collection))]))
    return jsonify({'persons': make_persons(tree_id), 'tree_list': tree_list, 'notifications_list': notifications_tree})


@app.route('/add', methods=['POST'])
def add_person():
    query_args = request.get_json(True)
    person_data = dict()
    collection = DBClient()['family']['persons']
    person_data['first_name'] = query_args.get('first_name').strip()
    person_data['middle_name'] = query_args.get('middle_name').strip()
    person_data['last_name'] = query_args.get('last_name').strip()
    person_data['description'] = query_args.get('description').strip()
    person_data['birth'] = query_args.get('birth')
    person_data['alive'] = query_args.get('is_alive')
    person_data['death'] = query_args.get('death')
    person_data['sex'] = query_args.get('sex')
    person_data['location'] = query_args.get('location')
    person_data['coordinate0'] = query_args.get('coordinate0', '')
    person_data['coordinate1'] = query_args.get('coordinate1', '')
    person_data['vk_id'] = query_args.get('vk_id', '')
    person_data['tree_id'] = query_args.get('tree_id', '')
    person_data['maiden_name'] = query_args.get('maiden_name', '')
    person_data['full_desc'] = query_args.get('full_desc', '')
    person_data['nationality'] = query_args.get('nationality', '').strip().lower()
    person_data['vk_confirm'] = query_args.get('vk_confirm')

    if person_data['vk_id']:
        exist_vk = collection.find_one({'vk_id': person_data['vk_id'], 'tree_id': person_data['tree_id']})
        if exist_vk:
            return jsonify({'Error': f'Персона с ВК {person_data["vk_id"]} уже есть в дереве', 'persons': '-1'})
    sex = query_args.get('sex')
    relative_type = query_args.get('relative_type')
    second_parent = query_args.get('second_parent', '')
    parent_m = ''
    parent_f = ''
    spouses = []
    other_parent = ''
    from_id = query_args.get('from_id')
    if relative_type == 'child':
        person = collection.find_one({'_id': from_id})
        parent_m, parent_f = (from_id, second_parent) if person['sex'] == 'M' else (second_parent, from_id)
    elif relative_type == 'parent':
        person = collection.find_one({'_id': from_id})
        person_name = ' '.join((person['first_name'], person['middle_name'], person['last_name'])).strip()
        if person['parent_m'] and sex == 'M':
            return jsonify({'Error': f'У {person_name} уже есть отец.', 'persons': -1})
        elif person['parent_f'] and sex == 'F':
            return jsonify({'Error': f'У {person_name} уже есть мать.', 'persons': -1})
        other_parent = person['parent_m'] or person['parent_f']
        if other_parent:
            spouses = [other_parent]
    person_data['parent_m'] = parent_m
    person_data['parent_f'] = parent_f
    person_data['spouses'] = spouses

    new_id = add_person_base(person_data)
    if spouses:
        collection.update_one({'_id': other_parent}, {'$addToSet': {'spouses': new_id}})
    if relative_type == 'spouse':
        link_persons_base(new_id, from_id, 'spouse')
    return jsonify({'new_id': new_id, 'persons': '1'})


@app.route('/change', methods=['POST'])
def change_person():
    request_data = request.get_json(True)
    person_id = request_data.pop('from_id', '')
    new_id = request_data.pop('new_id', '')
    if new_id:
        sex = request_data.get('sex')
        parent_str = 'parent_m' if sex == 'M' else 'parent_f'
        request_data = {parent_str: new_id}
    return jsonify(change_person_base(person_id, request_data))


@app.route('/link', methods=['POST'])
def link():
    query_args = request.get_json(True)
    link_type = query_args.get('link_type')
    from_id = query_args.get('person_id')
    target_id = query_args.get('link_id')
    return jsonify(link_persons_base(from_id, target_id, link_type))


@app.route('/remove', methods=['POST'])
def remove():
    query_args = request.get_json(True)
    person_id = query_args.get('person_id')
    return jsonify(remove_person_base(person_id, app_root))


@app.route('/map', methods=['POST'])
def get_map():
    user_id = request.get_json(True).get('user_id')
    if not user_id:
        user_id = 0
    collection = DBClient()['family']['persons']
    locations = dict()
    for person in collection.find({'tree_id': user_id, 'coordinate0': {'$exists': True, '$ne': ''}}):
        person_name = ' '.join((person['first_name'], person['middle_name'], person['last_name'])).strip()
        key = str(person['coordinate0']) + str(person['coordinate1'])
        locations[key] = locations.setdefault(key, []) + \
                         [{'person': person_name,
                           'coordinates': [person['coordinate0'],
                                           person['coordinate1']],
                           'surname': person['last_name']}]

    return render_template('map.html', locations=locations)


@app.route('/deletephoto', methods=['POST'])
def delete_photo():
    content = request.get_json(True)
    person_id = content['from_id']
    return jsonify(delete_photo_base(person_id, app_root))


@app.route('/uploadphoto', methods=['POST'])
def upload_photo():
    content = request.form
    collection = DBClient()['family']['persons']
    try:
        file = request.files['photo']
        user_id = int(content['user_id'])
        person_id = int(content['from_id'])
        ext = content['ext']
        hashed = (hash(file) % 10000 << 10) + random.randint(1, 999)
        path = f'/static/photos/custom/{person_id}_image_{hashed}.{ext}'
        delete_photo_base(person_id, app_root)
        file.save(app.root_path + path)
        collection.update_one({'_id': person_id, 'tree_id': user_id}, {'$set': {'image': path}})
        return jsonify({'persons': '1'})
    except (ValueError, TypeError) as err:
        logging.error(err)
        return jsonify({'Error': 'Загрузка фотографии неуспешна.', 'persons': -1})


@app.route('/import', methods=['POST'])
def import_gedcom():
    tree_id = request.form.get('tree_id', '')
    file = request.files['file_ged']
    if tree_id == '':
        return jsonify({'Error': 'Ошибка при загрузке, не указан id дерева'})
    if not file:
        return jsonify({'Error': 'Ошибка при загрузке файла'})
    return jsonify(import_gedcom_base(int(tree_id), request.files['file_ged']))


@app.route('/admin')
@auth.login_required
def stats():
    collection = DBClient()['family']['persons']
    all_persons = collection.estimated_document_count()
    vk_persons = collection.find({'vk_id': {'$ne': None}}).count()
    vk_persons_verified = collection.find({'vk_id': {'$ne': None}})
    vk_persons_ids = list(set([p['vk_id'] for p in vk_persons_verified]))
    vk_persons_results = []
    for vk in vk_persons_ids:
        vk_person = collection.find_one({'vk_id': vk})
        vk_persons_results.append([vk, vk_person['first_name'], vk_person['last_name'],
                                   collection.find({'tree_id': vk}).count()])
    return render_template('stats.html', all_persons=all_persons, vk_persons=vk_persons,
                           vk_persons_results=sorted(vk_persons_results, key=lambda person: person[3], reverse=True))


@app.route('/stats', methods=['POST'])
def local_stats():
    query_args = request.get_json(True)
    collection = DBClient()['family']['persons']
    try:
        tree_id = query_args.get('tree_id')
        user_id = query_args.get('user_id')
        all_persons = collection.find({'tree_id': tree_id})
        all_persons_count = len(list(collection.find({'tree_id': tree_id})))
        vk_persons = len(list(collection.find({'tree_id': tree_id, 'vk_id': {'$ne': None}})))
        vk_persons_verified = len(list(collection.find({'tree_id': tree_id, 'vk_id': {'$ne': None}, 'vk_confirm': 2})))
        last_name = list(collection.find({'vk_id': user_id, 'tree_id': tree_id}))[0]['last_name']
        last_name = last_name if last_name[-1] != 'а' else last_name[:-1]
        my_families = len(list(collection.find({"$or": [{'last_name': {'$regex': re.compile(last_name, re.IGNORECASE)}},
                                                        {'maiden_name': {
                                                            '$regex': re.compile(last_name, re.IGNORECASE)}}],
                                                'tree_id': tree_id})))
        all_persons_uniq = [p for p in all_persons if p['last_name']]
        all_families = [p['last_name'].lower() if p['last_name'] and p['last_name'][-1] != 'а'
                        else p['last_name'][:-1].lower() for p in all_persons_uniq]
        all_families = ', '.join(map(lambda item: item.title(), list(set(all_families))))
        return jsonify(
            {'all_persons': all_persons_count, 'vk_persons': vk_persons, 'vk_persons_results': vk_persons_verified,
             'my_families': my_families, 'all_families': all_families})
    except (ValueError, TypeError):
        return jsonify({'Error': 'Ошибка сбора статистики', 'persons': -1})


@app.route('/search', methods=['POST'])
def search_person():
    query_args = request.get_json(True)
    collection = DBClient()['family']['persons']
    try:
        search_item = query_args.get('search_item')
        tree_id = query_args.get('tree_id')
        results_name = list(collection.find({'first_name': {'$regex': re.compile(search_item, re.IGNORECASE)},
                                             'tree_id': tree_id}))
        results_surname = list(collection.find({'last_name': {'$regex': re.compile(search_item, re.IGNORECASE)},
                                                'tree_id': tree_id}))
        results_maidenname = list(collection.find({'maiden_name': {'$regex': re.compile(search_item, re.IGNORECASE)},
                                                   'tree_id': tree_id}))
        return jsonify({'persons': results_name + results_surname + results_maidenname})
    except (ValueError, TypeError):
        return jsonify({'Error': 'Ошибка поиска', 'persons': -1})


@app.route('/unlink', methods=['POST'])
def unlink():
    collection = DBClient()['family']['persons']
    query_args = request.get_json(True)
    vk_id = query_args.get('user_id')
    tree_id = query_args.get('tree_id')
    collection.update_one({'vk_id': vk_id, 'tree_id': tree_id}, {'$set': {'vk_confirm': 1}})
    return jsonify({'Удалена ссылка для ': vk_id})


if __name__ == '__main__':
    app.run(debug=True)
