from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def check_task_deadlines():
    # We must import inside the function to avoid AppRegistryNotReady
    from .models import Task

    now = timezone.now()
    # Looking for tasks due within the next 24 hours
    tomorrow = now + timedelta(days=1)

    try:
        # Get tasks that are NOT completed, haven't been reminded, and have reminders enabled
        tasks = Task.objects.filter(
            status__in=['To Do', 'In Progress'],
            reminder_sent=False,
            user__task_reminders_enabled=True
        )

        for task in tasks:
            # Combine deadline and due_time to make aware datetime
            due_datetime_naive = timezone.datetime.combine(task.deadline, task.due_time)
            due_datetime = timezone.make_aware(due_datetime_naive, timezone.get_default_timezone())

            if now <= due_datetime <= tomorrow:
                # Send email
                subject = f"Task Reminder: {task.title} is due soon!"
                message = f"Hello {task.user.username},\n\nYour task '{task.title}' is due on {task.deadline.strftime('%b %d, %Y')} at {task.due_time.strftime('%I:%M %p')}.\n\nPlease make sure to complete it on time!\n\nTaskFlow Team"
                
                try:
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [task.user.email],
                        fail_silently=False,
                    )
                    task.reminder_sent = True
                    task.save()
                    logger.info(f"Sent reminder for task {task.id} to {task.user.email}")
                except Exception as e:
                    logger.error(f"Error sending email for task {task.id}: {e}")

    except Exception as e:
        logger.error(f"Error in check_task_deadlines: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every 5 minutes to check for deadlines
    scheduler.add_job(
        check_task_deadlines,
        trigger=IntervalTrigger(minutes=5),
        id="task_deadline_checker",
        name="Check task deadlines and send emails",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started.")
