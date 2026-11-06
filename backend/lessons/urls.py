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
    CurriculumStageListView,
    CurriculumUnitListView,
    CurriculumLevelListView,
    CurriculumLevelDetailView,
    CurriculumRecordProgressView,
    CurriculumStageUnlockView,
    PlacementEvaluateView,
    PlacementConfirmView,
    AdaptiveRemedialCreateView,
    AdaptiveRemedialCompleteView,
)

urlpatterns = [
    # Legacy endpoints (preserved for existing tests & backward compatibility)
    path('', LessonsHealthView.as_view(), name='lessons_root'),
    path('levels/', LevelListView.as_view(), name='lessons_levels'),
    path('<int:pk>/', LessonDetailView.as_view(), name='lesson_detail'),
    path('progress/', LessonProgressListView.as_view(), name='lesson_progress_list'),
    path('progress/summary/', UserLessonProgressSummaryView.as_view(), name='lesson_progress_summary'),
    path('record/', RecordLessonProgressView.as_view(), name='lesson_record_progress_generic'),
    path('<int:lesson_id>/record/', RecordLessonProgressView.as_view(), name='lesson_record_progress'),

    # 10-Stage 7,000-Level Relational Curriculum Endpoints
    path('curriculum/stages/', CurriculumStageListView.as_view(), name='curriculum_stages'),
    path('curriculum/stages/<int:stage_number>/units/', CurriculumUnitListView.as_view(), name='curriculum_units'),
    path('curriculum/stages/<int:stage_number>/unlock/', CurriculumStageUnlockView.as_view(), name='curriculum_stage_unlock'),
    path('curriculum/levels/', CurriculumLevelListView.as_view(), name='curriculum_levels'),
    path('curriculum/levels/<str:identifier>/', CurriculumLevelDetailView.as_view(), name='curriculum_level_detail'),
    path('curriculum/levels/<str:identifier>/record/', CurriculumRecordProgressView.as_view(), name='curriculum_record_progress'),
    path('curriculum/placement/evaluate/', PlacementEvaluateView.as_view(), name='placement_evaluate'),
    path('curriculum/placement/confirm/', PlacementConfirmView.as_view(), name='placement_confirm'),
    path('curriculum/remedial/create/', AdaptiveRemedialCreateView.as_view(), name='remedial_create'),
    path('curriculum/remedial/<int:pk>/complete/', AdaptiveRemedialCompleteView.as_view(), name='remedial_complete'),
]
