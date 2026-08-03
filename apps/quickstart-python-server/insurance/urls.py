from django.urls import path

from . import views

urlpatterns = [
    path("auth/login/", views.login, name="login"),
    path("policies/", views.create_policy, name="create_policy"),
]
