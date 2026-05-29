import random
import requests
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from django.shortcuts import redirect
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.generics import ListCreateAPIView
from .models import User, Category, Task, KnowledgeBase, ChatMessage
from .serializers import UserSerializer, CategorySerializer, TaskSerializer, KnowledgeBaseSerializer, ChatMessageSerializer

def send_verification_email(email, username, code):
    subject = 'TaskFlow Email Verification'
    verify_url = f"http://127.0.0.1:8000/api/auth/verify-link/?email={email}&code={code}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #fafafa;
                margin: 0;
                padding: 0;
                color: #333333;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                border: 1px solid #f1f1f1;
            }}
            .header {{
                background: linear-gradient(135deg, #fee2e2 0%, #d1fae5 100%);
                padding: 40px 20px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                color: #0f172a;
                font-weight: 700;
                letter-spacing: -0.5px;
            }}
            .content {{
                padding: 40px 30px;
                text-align: center;
            }}
            .welcome {{
                font-size: 18px;
                color: #475569;
                margin-bottom: 8px;
                font-weight: 600;
            }}
            .text {{
                font-size: 15px;
                color: #64748b;
                line-height: 1.6;
                margin-bottom: 30px;
            }}
            .code-container {{
                background-color: #fef2f2;
                border: 2px dashed #fca5a5;
                padding: 16px;
                border-radius: 12px;
                display: inline-block;
                margin-bottom: 30px;
            }}
            .code-text {{
                font-size: 32px;
                font-weight: 800;
                color: #dc2626;
                letter-spacing: 6px;
            }}
            .button {{
                display: inline-block;
                padding: 14px 32px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: #ffffff !important;
                text-decoration: none;
                font-weight: 600;
                border-radius: 12px;
                font-size: 15px;
                box-shadow: 0 4px 6px rgba(16, 185, 129, 0.1);
                transition: transform 0.2s;
            }}
            .footer {{
                background-color: #f8fafc;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #94a3b8;
                border-top: 1px solid #f1f5f9;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>TaskFlow Email Verification</h1>
            </div>
            <div class="content">
                <p class="welcome">Hello {username},</p>
                <p class="text">Thank you for signing up for TaskFlow! Please use the verification code below to verify your email, or simply click the button below to verify automatically.</p>
                <div class="code-container">
                    <span class="code-text">{code}</span>
                </div>
                <div style="margin-top: 10px;">
                    <a href="{verify_url}" class="button">Verify Email Automatically</a>
                </div>
            </div>
            <div class="footer">
                <p>This email was sent automatically by TaskFlow. Please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """
    text_content = strip_tags(html_content)
    
    msg = EmailMultiAlternatives(subject, text_content, '"TaskFlow" <jeson1941@gmail.com>', [email])
    msg.attach_alternative(html_content, "text/html")
    msg.send()

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('userId', None)
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            if user.check_password(password):
                if not user.email_verified and not user.is_superuser:
                    return Response({'error': 'Email not verified', 'email': email, 'needs_verification': True}, status=status.HTTP_403_FORBIDDEN)
                
                return Response(UserSerializer(user).data)
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            code = f"{random.randint(100000, 999999)}"
            user.verification_code = code
            user.save()
            try:
                send_verification_email(user.email, user.username, code)
            except Exception as e:
                print(f"Error sending email: {e}")
            data = UserSerializer(user).data
            data['verification_code'] = code  # returned for dev since SMTP is blocked
            return Response(data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        if not email or not code:
            return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            if user.verification_code == code:
                user.email_verified = True
                user.verification_code = None
                user.save()
                return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
            return Response({'error': 'Invalid verification code'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class VerifyLinkView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = request.query_params.get('email')
        code = request.query_params.get('code')
        if not email or not code:
            return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            if user.verification_code == code:
                user.email_verified = True
                user.verification_code = None
                user.save()
                return redirect('http://localhost:5173/?verified=true')
            return Response({'error': 'Invalid or expired link'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class ResendCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            if user.email_verified:
                return Response({'error': 'Email is already verified'}, status=status.HTTP_400_BAD_REQUEST)
            
            code = f"{random.randint(100000, 999999)}"
            user.verification_code = code
            user.save()
            try:
                send_verification_email(user.email, user.username, code)
            except Exception as e:
                print(f"Error sending email: {e}")
            return Response({
                'message': 'Verification code resent successfully',
                'verification_code': code  # returned for dev since SMTP is blocked
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class ChatbotView(ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user_id = self.request.query_params.get("user_id")
        if user_id:
            return ChatMessage.objects.filter(user_id=user_id).order_by('created_at')
        return ChatMessage.objects.none()

    def create(self, request, *args, **kwargs):
        user_message = request.data.get("message")
        user_id = request.data.get("user_id")

        if not user_message:
            return Response({"error": "Message is required"}, status=status.HTTP_400_BAD_REQUEST)

        # save user message
        user_chat = ChatMessage.objects.create(
            role='user',
            message=user_message,
            user_id=user_id
        )

        # get knowledge
        knowledge = KnowledgeBase.objects.all()
        context = ""
        for item in knowledge:
            if item.text_content:
                context += item.text_content + "\n"

        # get user tasks
        tasks_text = ""
        if user_id:
            try:
                user_tasks = Task.objects.filter(user_id=user_id)
                if user_tasks.exists():
                    tasks_text = "Here are the user's current tasks:\n"
                    for t in user_tasks:
                        tasks_text += f"- Title: '{t.title}', Status: '{t.status}', Priority: '{t.priority}', Deadline: '{t.deadline}'\n"
                else:
                    tasks_text = "The user currently has no tasks.\n"
            except Exception as e:
                print(f"Error fetching tasks: {e}")

        # get recent history (up to last 3 conversations, i.e., last 6 messages)
        history_text = ""
        if user_id:
            # Get the history excluding the user message we just created
            history_messages = ChatMessage.objects.filter(user_id=user_id).exclude(id=user_chat.id).order_by('-created_at')[:6]
            history_messages = reversed(list(history_messages))
            for msg in history_messages:
                role_name = "User" if msg.role == 'user' else "Assistant"
                history_text += f"{role_name}: {msg.message}\n"

        prompt = f"""You are a helpful task assistant named "TaskFlow AI".
Use the following context (including the user's current tasks and knowledge base) to answer the user's questions.

{tasks_text}

Knowledge Base:
{context}

Chat History:
{history_text}
User: {user_message}
Assistant:"""

        try:
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "qwen2.5:0.5b",
                    "prompt": prompt,
                    "stream": False
                },
                timeout=30
            )
            response.raise_for_status()
            data = response.json()
            ai_response = data.get("response", "I'm having trouble connecting to my brain right now.")
        except Exception as e:
            print(f"Error calling Ollama: {e}")
            ai_response = "Error: TaskFlow AI service is temporarily unavailable. Please make sure Ollama is running and qwen2.5:0.5b is pulled."

        # save AI response
        ai_chat = ChatMessage.objects.create(
            role='assistant',
            message=ai_response,
            user_id=user_id
        )

        return Response({
            "user": ChatMessageSerializer(user_chat).data,
            "assistant": ChatMessageSerializer(ai_chat).data
        }, status=status.HTTP_201_CREATED)


class KnowledgeBaseView(ListCreateAPIView):
    queryset = KnowledgeBase.objects.all()
    serializer_class = KnowledgeBaseSerializer
    permission_classes = [AllowAny]

