from rest_framework import generics
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.permissions import AllowAny

@api_view(['GET'])
def application_list(request):
    return Response({
        'message': 'Applications endpoint working',
        'data': []
    })

class ApplicationListCreateView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({'message': 'GET applications'})
    
    def post(self, request):
        return Response({'message': 'POST application'})

class ApplicationDetailView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    
    def get(self, request, tracking_number):
        return Response({'message': f'Get application {tracking_number}'})