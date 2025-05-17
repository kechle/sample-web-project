from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import home, SampleList, SampleDetail, RegisterView, LoginView, CategoryList, TagList, samples_page, LikeSampleView, UnlikeSampleView, UserSamplesView, LikedSamplesView, LogoutView, SampleDownloadView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home, name='home'),
    path('api/samples/', SampleList.as_view(), name='sample-list'),
    path('api/samples/<int:pk>/', SampleDetail.as_view(), name='sample-detail'),
    path('api/samples/<int:pk>/download/', SampleDownloadView.as_view(), name='sample-download'),
    path('api/samples/<int:pk>/like/', LikeSampleView.as_view(), name='sample-like'),
    path('api/samples/<int:pk>/unlike/', UnlikeSampleView.as_view(), name='sample-unlike'),
    path('api/samples/liked/', LikedSamplesView.as_view(), name='liked-samples'),
    path('api/my-samples/', UserSamplesView.as_view(), name='user-samples'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),
    path('api/categories/', CategoryList.as_view(), name='category-list'),
    path('api/tags/', TagList.as_view(), name='tag-list'),
    path('samples/', samples_page, name='samples-page'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)