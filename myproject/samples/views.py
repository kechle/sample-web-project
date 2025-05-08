from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django.db.models import Q
from .models import Sample, DownloadHistory, Category, Tag, Like
from .serializers import SampleSerializer, DownloadHistorySerializer, CategorySerializer, TagSerializer, LikeSerializer
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.shortcuts import render
from rest_framework.pagination import PageNumberPagination

class SampleList(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        category = request.query_params.get('category', None)
        tags = request.query_params.get('tags', None)
        search = request.query_params.get('search', None)
        bpm = request.query_params.get('bpm', None)
        samples = Sample.objects.all()
        if category:
            samples = samples.filter(category__id=category)
        if tags:
            tag_list = tags.split(',')
            for tag_id in tag_list:
                samples = samples.filter(tags__id=tag_id)
        if bpm:
            samples = samples.filter(bpm=bpm)
        if search:
            samples = samples.filter(Q(name__icontains=search) | Q(description__icontains=search))
        samples = samples.order_by('-id')
        paginator = PageNumberPagination()
        paginator.page_size = int(request.query_params.get('page_size', 25))
        page = paginator.paginate_queryset(samples, request)
        serializer = SampleSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = SampleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SampleDetail(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, pk):
        try:
            sample = Sample.objects.get(pk=pk)
        except Sample.DoesNotExist:
            return Response({'error': 'Sample not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = SampleSerializer(sample)
        return Response(serializer.data)

    def post(self, request, pk):
        try:
            sample = Sample.objects.get(pk=pk)
        except Sample.DoesNotExist:
            return Response({'error': 'Sample not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Записываем информацию о скачивании
        download_history = DownloadHistory(user=request.user, sample=sample)
        download_history.save()
        
        return Response({'message': 'Download recorded'}, status=status.HTTP_201_CREATED)

class RegisterView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        email = request.data.get('email')
        if not username or not password:
            return Response({'error': 'Please provide both username and password'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        user = User.objects.create_user(username=username, email=email, password=password)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key}, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        if not username or not password:
            return Response({'error': 'Please provide both username and password'}, status=status.HTTP_400_BAD_REQUEST)
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key})
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

def home(request):
    return render(request, 'index.html')

class CategoryList(APIView):
    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

class TagList(APIView):
    def get(self, request):
        tags = Tag.objects.all()
        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data)

def samples_page(request):
    return render(request, 'samples.html')

class LikeSampleView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        try:
            sample = Sample.objects.get(pk=pk)
        except Sample.DoesNotExist:
            return Response({'error': 'Sample not found'}, status=status.HTTP_404_NOT_FOUND)
        like, created = Like.objects.get_or_create(user=user, sample=sample)
        if created:
            return Response({'message': 'Liked'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'Already liked'}, status=status.HTTP_200_OK)

class UnlikeSampleView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        try:
            sample = Sample.objects.get(pk=pk)
        except Sample.DoesNotExist:
            return Response({'error': 'Sample not found'}, status=status.HTTP_404_NOT_FOUND)
        Like.objects.filter(user=user, sample=sample).delete()
        return Response({'message': 'Unliked'}, status=status.HTTP_200_OK)

class UserLikesView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        likes = Like.objects.filter(user=user).select_related('sample')
        samples = [like.sample for like in likes]
        serializer = SampleSerializer(samples, many=True)
        return Response(serializer.data)

class UserSamplesView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        samples = Sample.objects.filter(user=user)
        serializer = SampleSerializer(samples, many=True)
        return Response(serializer.data)

class LikedSamplesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        liked_samples = [like.sample for like in Like.objects.filter(user=request.user)]
        serializer = SampleSerializer(liked_samples, many=True)
        return Response(serializer.data)

class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'success': 'Logged out'})