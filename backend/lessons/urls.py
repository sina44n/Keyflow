"""
Lessons URL Configuration.
"""
from django.urls import path
from .views import (
    LessonsHealthView,
    LevelListView,
    LessonDetailView,
    LessonProgressListView,
    RecordLessonProgressView,
    UserLessonProgressSummaryView,
)

urlpatterns = [
    path('', LessonsHealthView.as_view(), name='lessons_root'),
    path('levels/', LevelListView.as_view(), name='lessons_levels'),
    path('<int:pk>/', LessonDetailView.as_view(), name='lesson_detail'),
    path('progress/', LessonProgressListView.as_view(), name='lesson_progress_list'),
    path('progress/summary/', UserLessonProgressSummaryView.as_view(), name='lesson_progress_summary'),
    path('record/', RecordLessonProgressView.as_view(), name='lesson_record_progress_generic'),
    path('<int:lesson_id>/record/', RecordLessonProgressView.as_view(), name='lesson_record_progress'),
]
