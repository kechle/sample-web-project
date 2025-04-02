from django.contrib import admin
from .models import Sample, Category, Tag, DownloadHistory

admin.site.register(Category)
admin.site.register(Tag)
admin.site.register(Sample)
admin.site.register(DownloadHistory)