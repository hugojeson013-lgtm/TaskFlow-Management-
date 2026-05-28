import time
import threading
import zoneinfo
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags

def send_upcoming_reminders():
    # Avoid circular imports
    from .models import Task
    
    ph_tz = zoneinfo.ZoneInfo("Asia/Manila")
    now = timezone.now().astimezone(ph_tz)
    
    # We want to check for tasks that:
    # 1. Are not Done
    # 2. Have reminder_sent = False
    # 3. User has task_reminders_enabled = True
    # 4. Are due within the next 24 hours (1 day ahead)
    
    tasks = Task.objects.filter(
        status__in=['To Do', 'In Progress'],
        reminder_sent=False,
        user__task_reminders_enabled=True
    )
    
    for t in tasks:
        try:
            # Combine deadline and due_time
            due_time = t.due_time or datetime.min.time()
            due_datetime_naive = datetime.combine(t.deadline, due_time)
            due_datetime = timezone.make_aware(due_datetime_naive, ph_tz)
            
            time_diff = due_datetime - now
            
            # If the task is due within the next 24 hours and is in the future
            if timedelta(hours=0) < time_diff <= timedelta(hours=24):
                # Send email reminder
                send_reminder_email(t)
                t.reminder_sent = True
                t.save(update_fields=['reminder_sent'])
        except Exception as e:
            print(f"Error processing reminder for task {t.id}: {e}")

def send_reminder_email(task):
    user = task.user
    subject = f'TaskFlow Reminder: "{task.title}" is due soon!'
    
    # Format time nicely
    time_str = task.due_time.strftime("%I:%M %p") if task.due_time else "12:00 PM"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Task Due Reminder</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fafafa; margin: 0; padding: 0; color: #333333; }}
            .container {{ max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #f1f1f1; }}
            .header {{ background: linear-gradient(135deg, #fee2e2 0%, #d1fae5 100%); padding: 40px 20px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 28px; color: #0f172a; font-weight: 700; letter-spacing: -0.5px; }}
            .content {{ padding: 40px 30px; text-align: center; }}
            .welcome {{ font-size: 18px; color: #475569; margin-bottom: 8px; font-weight: 600; }}
            .text {{ font-size: 15px; color: #64748b; line-height: 1.6; margin-bottom: 30px; }}
            .task-card {{ background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; display: inline-block; text-align: left; width: 80%; margin: 0 auto 30px auto; }}
            .task-title {{ font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }}
            .task-meta {{ font-size: 14px; color: #64748b; margin-bottom: 4px; }}
            .button {{ display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff !important; text-decoration: none; font-weight: 600; border-radius: 12px; font-size: 15px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.1); }}
            .footer {{ background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Task Due Soon!</h1>
            </div>
            <div class="content">
                <p class="welcome">Hello {user.first_name or user.username},</p>
                <p class="text">This is a friendly reminder that one of your tasks is due in less than 24 hours.</p>
                <div class="task-card">
                    <div class="task-title">{task.title}</div>
                    <div class="task-meta"><strong>Deadline:</strong> {task.deadline} at {time_str} (Manila Time)</div>
                    <div class="task-meta"><strong>Priority:</strong> {task.priority}</div>
                    <div class="task-meta"><strong>Status:</strong> {task.status}</div>
                </div>
                <div style="margin-top: 10px;">
                    <a href="http://localhost:5173/" class="button">View Dashboard</a>
                </div>
            </div>
            <div class="footer">
                <p>You received this because you enabled email reminders in your Settings.</p>
            </div>
        </div>
    </body>
    </html>
    """
    text_content = strip_tags(html_content)
    
    msg = EmailMultiAlternatives(subject, text_content, '"TaskFlow" <jeson1941@gmail.com>', [user.email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()

def start_reminder_thread():
    def run():
        # Delay startup slightly to let django initialize
        time.sleep(5)
        while True:
            try:
                send_upcoming_reminders()
            except Exception as e:
                print(f"Error in background reminders: {e}")
            # Check every 60 seconds
            time.sleep(60)
            
    thread = threading.Thread(target=run, daemon=True)
    thread.start()
