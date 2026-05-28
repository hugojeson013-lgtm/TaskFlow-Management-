from rest_framework import serializers
from .models import User, Category, Task, KnowledgeBase, ChatMessage

class UserSerializer(serializers.ModelSerializer):
    name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'middle_name', 'last_name',
            'age', 'occupation', 'city_address', 'profile_picture', 'name', 'password',
            'email_verified', 'is_staff', 'is_superuser', 'last_login', 'date_joined',
            'two_factor_enabled', 'task_reminders_enabled'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'last_login': {'read_only': True},
            'date_joined': {'read_only': True}
        }

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            middle_name=validated_data.get('middle_name', ''),
            last_name=validated_data.get('last_name', ''),
            age=validated_data.get('age'),
            occupation=validated_data.get('occupation', ''),
            city_address=validated_data.get('city_address', ''),
            profile_picture=validated_data.get('profile_picture', ''),
            password=validated_data['password']
        )
        return user

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'color']

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'title', 'priority', 'status', 'deadline', 'due_time', 'category', 'user']
        
    def validate_title(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Task title cannot be empty.")
        return value


class KnowledgeBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBase
        fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'

