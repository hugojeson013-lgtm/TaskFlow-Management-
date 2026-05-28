from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, TaskViewSet, UserViewSet, LoginView, SignupView, 
    VerifyCodeView, VerifyLinkView, ResendCodeView, ChatbotView, KnowledgeBaseView
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/signup/', SignupView.as_view(), name='signup'),
    path('auth/verify/', VerifyCodeView.as_view(), name='verify-code'),
    path('auth/verify-link/', VerifyLinkView.as_view(), name='verify-link'),
    path('auth/resend-code/', ResendCodeView.as_view(), name='resend-code'),
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    path('knowledge/', KnowledgeBaseView.as_view(), name='knowledge'),
    path('', include(router.urls)),
]

