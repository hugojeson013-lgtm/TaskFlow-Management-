from django.apps import AppConfig
import os


class CoreConfig(AppConfig):
    name = 'core'

    def ready(self):
        if os.environ.get('RUN_MAIN') == 'true':
            from .reminders import start_reminder_thread
            start_reminder_thread()
