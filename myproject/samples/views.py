from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.http import HttpResponse, FileResponse
from .models import Sample, Category, Tag, DownloadHistory, Like
from .serializers import (
    SampleSerializer, CategorySerializer, TagSerializer,
    DownloadHistorySerializer, LikeSerializer
)
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from rest_framework.pagination import PageNumberPagination

class SampleList(generics.ListCreateAPIView):
    queryset = Sample.objects.all()
    serializer_class = SampleSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SampleDetail(generics.RetrieveUpdateDestroyAPIView):
    queryset = Sample.objects.all()
    serializer_class = SampleSerializer
    permission_classes = [AllowAny]

class SampleDownloadView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            sample = Sample.objects.get(pk=pk)
            if not sample.file:
                return Response(status=status.HTTP_404_NOT_FOUND)
            response = FileResponse(sample.file.open('rb'), as_attachment=True, filename=sample.file.name)
            # Записываем историю загрузок
            if request.user.is_authenticated:
                DownloadHistory.objects.create(user=request.user, sample=sample)
            return response
        except Sample.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

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