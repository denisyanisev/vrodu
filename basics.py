import os
import logging

from python_gedcom_2.parser import Parser
from python_gedcom_2.element.individual import IndividualElement
from python_gedcom_2.element.family import FamilyElement
from db import DBClient


def make_direct_relatives(person_id: int):
    collection = DBClient()['family']['persons']
    person = collection.find_one({'_id': person_id})
    relatives = list(filter(lambda x: not (x is None or x == ''), (person['parent_m'], person['parent_f'])))
    for a in list(relatives):
        relatives.extend(make_direct_relatives(a))
    return relatives


def make_persons(tree_id: int = 0):
    """ make complete list of persons for a tree """
    collection = DBClient()['family']['persons']
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
        person['parents'] = [person.pop('parent_m'), person.pop('parent_f')]
        if not person['alive'] and person['death']:
            years = (person['birth'] if person['birth'] else '...') + '-' + person['death']
        elif not person['alive']:
            years = (person['birth'] if person['birth'] else '...') + '-...'
        else:
            years = person['birth']
        person['years'] = years
        if not person.get('image'):
            if person['sex'] == 'M':
                person['image'] = '/static/photos/male.png'
            else:
                person['image'] = '/static/photos/female.png'
        persons.append(person)
    return persons


def add_person_base(person_data: dict):
    """ insert new person record to db
    person_data fields:
    first_name, middle_name, last_name, parent_m, parent_f, spouses, image, description, full_desc, sex, birth, death,
    alive, location, coordinate0, coordinate1, vk_id, maiden_name, nationality, tree_id, permissions, vk_confirm

    first_name is mandatory
    """
    collection = DBClient()['family']['persons']
    fields = ['first_name', 'middle_name', 'last_name', 'parent_m', 'parent_f', 'spouses', 'image', 'description',
              'full_desc', 'sex', 'birth', 'death', 'alive', 'location', 'coordinate0', 'coordinate1', 'vk_id',
              'maiden_name', 'nationality', 'tree_id', 'permissions', 'vk_confirm']
    new_id = collection.find_one({}, sort=[('_id', -1)])['_id'] + 1 if collection.count_documents(dict()) else 0
    new_person = {'_id': new_id}
    """ Empty line defaults """
    for field in fields:
        new_person[field] = person_data.get(field, '')
    """ Non empty line defaults """
    new_person['spouses'] = person_data.get('spouses', [])
    new_person['permissions'] = person_data.get('permissions', 777)
    new_person['vk_confirm'] = person_data.get('vk_confirm', None)
    new_person['vk_id'] = person_data.get('vk_id', None)

    collection.insert_one(new_person)
    return new_id


def change_person_base(person_id: int, person_data: dict):
    """ change person's data """
    collection = DBClient()['family']['persons']
    try:
        collection.update_one({'_id': person_id}, {'$set': person_data})
        return {'Status': 'ok', 'persons': '1'}
    except (ValueError, TypeError) as err:
        logging.error(err)
        return {'Error': 'Нe удалось изменить персону.', 'persons': -1}


def link_persons_base(from_id: int, target_id: int, link_type: str):
    """ link two persons together as spouses or relatives """
    collection = DBClient()['family']['persons']
    target_person = collection.find_one({'_id': target_id})
    from_person = collection.find_one({'_id': from_id})
    target_name = ' '.join((target_person['first_name'], target_person['middle_name'], target_person['last_name']))
    from_name = ' '.join((from_person['first_name'], from_person['middle_name'], from_person['last_name']))
    if link_type == 'spouse':
        if target_person['sex'] == from_person['sex']:
            return {'Error': 'Запрещено создавать однополные браки.', 'persons': -1}
        if from_id in target_person['spouses']:
            return {'Error': 'Между персонами уже есть брак.', 'persons': -1}
        collection.update_one({'_id': target_id}, {'$push': {'spouses': from_id}})
        collection.update_one({'_id': from_id}, {'$push': {'spouses': target_id}})
        return {'Status': 'ok', 'persons': '1'}
    else:
        if link_type == 'parent':
            from_name, target_name = target_name, from_name
            from_id, target_id = target_id, from_id
            from_person, target_person = target_person, from_person
        try:
            if target_id in make_direct_relatives(from_id):
                return {'Error': f'{target_name} является предком {from_name}.', 'persons': -1}
            if from_person['sex'] == 'M':
                if from_id == target_person['parent_m']:
                    return {'Error': f'{from_name} уже является отцом {target_name}.', 'persons': -1}
                elif target_person['parent_m']:
                    return {'Error': f'У {target_name} уже есть отец.', 'persons': -1}
                collection.update_one({'_id': int(target_id)}, {'$set': {'parent_m': from_id}})
            else:
                if from_id == target_person['parent_f']:
                    return {'Error': f'{from_name} уже является матерью {target_name}.', 'persons': -1}
                elif target_person['parent_f']:
                    return {'Error': f'У {target_name} уже есть мать.', 'persons': -1}
                collection.update_one({'_id': int(target_id)}, {'$set': {'parent_f': from_id}})
        except (ValueError, TypeError) as err:
            logging.error(err)
            return {'Error': 'Не удалось связать персоны.', 'persons': -1}
        return {'Status': 'ok', 'persons': '1'}


def remove_person_base(person_id: int):
    """ remove a person """
    collection = DBClient()['family']['persons']
    person = collection.find_one({'_id': person_id})
    if not person:
        return {'Error': 'Не найдена персона для удаления', 'persons': -1}
    try:
        sex = person['sex']
        parent_str = 'parent_m' if sex == 'M' else 'parent_f'
        delete_photo_base(person_id)
        collection.delete_one({'_id': int(person_id)})
        collection.update_many({parent_str: person_id}, {'$set': {parent_str: ''}})
        collection.update_many({'spouses': person_id}, {'$pull': {'spouses': person_id}})
        return {'Status': 'Персона удалена.', 'persons': '1'}
    except (ValueError, TypeError) as err:
        logging.error(err)
        return {'Error': 'Удаление персоны неуспешно.', 'persons': -1}


def delete_photo_base(person_id: int):
    """ delete person's photo """
    collection = DBClient()['family']['persons']
    person = collection.find_one({'_id': person_id})
    if person.get('image', ''):
        try:
            if not ('userapi' in person['image']):
                os.remove('.' + person['image'])
            collection.update_one({'_id': person_id}, {'$set': {'image': ''}})
            return {'Status': 'Фотография удалена.', 'persons': '1'}
        except OSError as err:
            logging.error(err)
            return {'Error': 'Удаление фото неуспешно.', 'persons': -1}


# noinspection PyTypeChecker
def import_gedcom_base(tree_id, file):
    """ parse gedcom file and make useful dict of it """
    collection = DBClient()['family']['persons']
    parser = Parser()
    try:
        parser.parse(file, False)
        tree = parser.get_element_list()
        persons, families = dict(), dict()
        for elem in tree:
            if type(elem) is IndividualElement:
                pointer = elem.get_pointer()
                birth = str(elem.get_birth_year()) if elem.get_birth_year() > 0 else ''
                death = str(elem.get_death_year()) if elem.get_death_year() > 0 else ''
                persons[pointer] = {'elem': elem, 'data': {
                    'first_name': elem.get_name()[0],
                    'last_name': elem.get_name()[1],
                    'description': elem.get_occupation(),
                    'sex': elem.get_gender(),
                    'birth': birth,
                    'death': death,
                    'alive': not elem.is_deceased(),
                    'spouses': [],
                    'tree_id': tree_id}}
                persons[pointer]['id'] = add_person_base(persons[pointer]['data'])
            if type(elem) is FamilyElement:
                families[elem.get_pointer()] = elem
        for pointer in families:
            husband = parser.get_family_members(families[pointer],
                                                members_type='HUSB')
            if husband:
                husband = husband[0]
            wife = parser.get_family_members(families[pointer],
                                             members_type='WIFE')
            if wife:
                wife = wife[0]
            children = parser.get_family_members(families[pointer],
                                                 members_type='CHIL')
            if wife and husband:
                persons[husband.get_pointer()]['data']['spouses'].append(persons[wife.get_pointer()]['id'])
                persons[wife.get_pointer()]['data']['spouses'].append(persons[husband.get_pointer()]['id'])
            if wife:
                for child in children:
                    persons[child.get_pointer()]['data']['parent_f'] = persons[wife.get_pointer()]['id']
            if husband:
                for child in children:
                    persons[child.get_pointer()]['data']['parent_m'] = persons[husband.get_pointer()]['id']
        for pointer in persons:
            collection.update_one({'_id': persons[pointer]['id']}, {'$set': persons[pointer]['data']})
        return {'Success': 'Импорт удачно завершен'}
    except TypeError as err:
        logging.error(err)
        return {'Error': 'Не удалось импортировать файл'}
