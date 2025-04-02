from rest_framework import serializers
from .models import Sample

class SampleSerializers(serializers.ModelSerializer):
    class Meta:
        model = Sample
        fields = '__all__'