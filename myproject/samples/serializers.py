from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, Tag, Sample, DownloadHistory, Like
import base64

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class SampleSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(), many=True, source='tags', write_only=True
    )
    file_url = serializers.SerializerMethodField()
    file = serializers.FileField(write_only=True)
    bpm = serializers.IntegerField(required=True)

    class Meta:
        model = Sample
        fields = ['id', 'name', 'description', 'file_url', 'file', 'category', 'category_id', 'tags', 'tag_ids', 'bpm', 'created_at']

    def get_file_url(self, obj):
        return obj.get_file_url()

class DownloadHistorySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    sample = SampleSerializer(read_only=True)

    class Meta:
        model = DownloadHistory
        fields = ['id', 'user', 'sample', 'download_time']

class LikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Like
        fields = ['id', 'user', 'sample', 'created_at']