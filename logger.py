def config(root_path):
    logging_config = {
        'version': 1,
        'disable_existing_loggers': True,
        'formatters': {
            'standard': {
                'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
            },
        },
        'handlers': {
            'default': {
                'level': 'INFO',
                'formatter': 'standard',
                'class': 'logging.handlers.RotatingFileHandler',
                'filename': f'{root_path}/application.log',
                'maxBytes': 50 * 1024,
                'backupCount': 2,
            },
            'warning': {
                'level': 'WARNING',
                'formatter': 'standard',
                'class': 'logging.handlers.TimedRotatingFileHandler',
                'filename': f'{root_path}/errors.log',
                'when': 'W0',
                'backupCount': 4,
            }
        },
        'loggers': {
            '': {
                'handlers': ['default', 'warning'],
                'level': 'WARNING',
                'propagate': False
            },
            'werkzeug': {
                'handlers': ['default', 'warning'],
                'level': 'INFO',
                'propagate': False
            },
        }
    }
    return logging_config
